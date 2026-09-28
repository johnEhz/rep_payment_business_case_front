import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearOrder, payOrder, trackOrder, updatePaymentResult } from '../../store/slices/orderSlice';
import { resetCheckout, fetchMerchantData } from '../../store/slices/checkoutSlice';
import { fetchProducts } from '../../store/slices/catalogSlice';
import { clearAllStorage } from '../../utils/session';
import { AppHeader } from '../../components/AppHeader';
import { CreditCardModal } from '../../components/CreditCardModal';
import { CreditCardModalFormValues } from '../../utils/validators';
import { tokenizeCard } from '../../utils/gateway';
import { formatCOP } from '../../utils/currency';
import { ordersApi } from '../../api/orders.api';
import { PaymentStatusResponse } from '../../types';

export const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { paymentResult, currentOrder, paying } = useAppSelector((s) => s.order);
  const { merchantData } = useAppSelector((s) => s.checkout);

  // Estado del backend en tiempo real (fuente única de verdad)
  const [liveStatus, setLiveStatus] = useState<PaymentStatusResponse | null>(null);

  // Orden priorizando la versión más fresca del backend
  const order = currentOrder ?? paymentResult?.order;

  // Estado definitivo de aprobación
  const isSuccess =
    order?.status === 'PAID' ||
    order?.status === 'DELIVERED' ||
    liveStatus?.orderStatus === 'PAID' ||
    liveStatus?.orderStatus === 'DELIVERED' ||
    liveStatus?.activeTransaction?.status === 'APPROVED' ||
    (paymentResult?.success === true && paymentResult?.status !== 'PENDING');

  // Transacción activa
  const tx =
    (liveStatus?.activeTransaction
      ? {
          reference: liveStatus.activeTransaction.reference,
          status: liveStatus.activeTransaction.status,
          paymentMethod: liveStatus.activeTransaction.paymentMethod,
          installments: liveStatus.activeTransaction.installments,
        }
      : undefined) ||
    paymentResult?.transaction ||
    order?.transaction;

  // Estado para modal de reintento de pago
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Estado pendiente / indeterminado (reutiliza la pantalla oficial de procesamiento)
  const isPending =
    !isSuccess &&
    (isRetrying ||
      paying ||
      (liveStatus
        ? liveStatus.isPaymentPending || liveStatus.activeTransaction?.status === 'PENDING'
        : paymentResult?.status === 'PENDING' ||
          paymentResult?.transaction?.status === 'PENDING' ||
          order?.status === 'PAYMENT_PENDING' ||
          order?.status === 'CREATED'));

  // Estado para la animación de pantalla completa que se desvanece a los 2 segundos
  const [splashState, setSplashState] = useState<'showing' | 'fading' | 'gone'>(() => {
    // Si todavía está pendiente de respuesta, no mostrar splash de éxito/fallo
    return 'showing';
  });
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isPending || !order?.orderNumber) return;
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    setSplashState('showing');

    // Se mantiene en pantalla completa durante ~1.8 segundos
    const fadeTimer = setTimeout(() => {
      setSplashState('fading');
    }, 1800);

    // A los 2.4 segundos se oculta completamente y revela el resumen suavemente
    const doneTimer = setTimeout(() => {
      setSplashState('gone');
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [isPending, order?.orderNumber]);

  // Polling cada 2.5 segundos mientras el pago esté PENDING
  useEffect(() => {
    if (!order?.orderNumber || isSuccess || !isPending) return;

    let isMounted = true;

    const pollPaymentStatus = async () => {
      try {
        const statusRes = await ordersApi.getPaymentStatus(order.orderNumber, order.accessToken);
        if (!isMounted) return;

        setLiveStatus(statusRes);

        // Si el estado en el backend pasó a ser aprobado (por Webhook o reconciliación)
        if (
          statusRes.orderStatus === 'PAID' ||
          statusRes.orderStatus === 'DELIVERED' ||
          statusRes.activeTransaction?.status === 'APPROVED'
        ) {
          toast.success('¡Pago aprobado exitosamente!');
          await dispatch(trackOrder({ orderNumber: order.orderNumber, token: order.accessToken }));
          dispatch(
            updatePaymentResult({
              success: true,
              status: 'APPROVED',
            })
          );
        } else if (
          statusRes.activeTransaction &&
          ['DECLINED', 'ERROR', 'VOIDED', 'CANCELLED'].includes(statusRes.activeTransaction.status) &&
          !statusRes.isPaymentPending
        ) {
          toast.error('Pago no aprobado', {
            description:
              statusRes.activeTransaction.statusMessage ||
              'La transacción fue declinada por la entidad financiera.',
          });
          await dispatch(trackOrder({ orderNumber: order.orderNumber, token: order.accessToken }));
          dispatch(
            updatePaymentResult({
              success: false,
              status: statusRes.activeTransaction.status,
              canRetry: statusRes.canRetry,
            })
          );
        }
      } catch (err) {
        console.warn('[StatusPage] Error polling payment status:', err);
      }
    };

    // Consulta inicial inmediata
    pollPaymentStatus();

    // Polling cada 2.5 segundos (2–3 segundos requeridos)
    const interval = setInterval(pollPaymentStatus, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [order?.orderNumber, order?.accessToken, isSuccess, isPending, dispatch]);

  // Asegurar merchant data para reintentos de tokenización de tarjetas
  useEffect(() => {
    if (!merchantData) {
      dispatch(fetchMerchantData());
    }
  }, [dispatch, merchantData]);

  // Temporizador para vigencia de la orden
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!order?.expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!order?.expiresAt || isSuccess) return;
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.expiresAt, isSuccess]);

  const isOrderExpired = timeLeft <= 0;

  const isOrderCancelled = order?.status === 'CANCELLED' || liveStatus?.orderStatus === 'CANCELLED';

  useEffect(() => {
    if (isSuccess || isOrderExpired) {
      clearAllStorage();
      dispatch(resetCheckout());
      // Reemplazar historial para que "Atrás" no retorne a checkout ni a summary
      window.history.replaceState(null, '', window.location.href);
    }
  }, [isSuccess, isOrderExpired, dispatch]);

  // Si el usuario presiona el botón "Atrás" del navegador tras un pago exitoso, redirigirlo a la tienda
  useEffect(() => {
    if (!isSuccess) return;
    const handlePopState = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSuccess, navigate]);

  const canRetry =
    !isPending &&
    (liveStatus ? liveStatus.canRetry : (paymentResult?.canRetry ?? true)) &&
    !isOrderCancelled &&
    !isOrderExpired &&
    !isSuccess;

  const handleStartOver = async () => {
    if (!isSuccess) {
      try {
        await ordersApi.cancelActiveOrder();
      } catch {}
    }
    dispatch(clearOrder());
    dispatch(resetCheckout());
    clearAllStorage();
    dispatch(fetchProducts());
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetryPayment = async (cardData: CreditCardModalFormValues) => {
    if (!order) {
      toast.error('No se encontró información de la orden para reintentar el pago');
      return;
    }

    if (isPending) {
      toast.warning('Hay una transacción en proceso de validación. Por favor espera a que se complete.');
      setIsRetryModalOpen(false);
      return;
    }

    if (!canRetry || isOrderCancelled) {
      toast.error('Esta orden no admite más intentos de pago.');
      setIsRetryModalOpen(false);
      return;
    }

    if (isOrderExpired) {
      toast.error('La orden ya ha expirado. Debes generar un nuevo pedido.');
      setIsRetryModalOpen(false);
      return;
    }

    if (!merchantData) {
      toast.error('Cargando llaves de la pasarela. Por favor intenta en un segundo.');
      dispatch(fetchMerchantData());
      return;
    }

    setLiveStatus(null);
    setIsRetrying(true);
    setIsRetryModalOpen(false);
    toast.loading('Validando transacción...', {
      id: 'retry-payment-toast',
      duration: 15000,
    });

    try {
      // 1. Tokenizar la nueva tarjeta directamente contra la API de la pasarela
      const cardToken = await tokenizeCard(
        {
          number: cardData.cardNumber,
          cvc: cardData.cvc,
          exp_month: cardData.expMonth,
          exp_year: cardData.expYear,
          card_holder: cardData.cardHolder,
        },
        merchantData.publicKey,
        merchantData.gatewayApiUrl
      );

      // 2. Ejecutar el nuevo intento de cobro vinculado a la orden con clave de idempotencia propia
      const payResult = await dispatch(
        payOrder({
          orderNumber: order.orderNumber,
          accessToken: order.accessToken,
          acceptanceToken: merchantData.acceptanceToken,
          cardToken,
          installments: Number(cardData.installments) || 1,
          idempotencyKey: `pay_${order.orderNumber}_retry_${Date.now()}`,
        })
      );

      toast.dismiss('retry-payment-toast');

      if (payOrder.fulfilled.match(payResult)) {
        if (payResult.payload?.status === 'APPROVED' || payResult.payload?.success) {
          toast.success('¡Pago aprobado exitosamente!');
        } else if (payResult.payload?.status !== 'PENDING') {
          toast.error('El pago no fue aprobado', {
            description: payResult.payload?.message || 'Por favor revisa los fondos o intenta con otra tarjeta.',
          });
        }
      } else {
        const errorMsg = (payResult.payload as string) || 'Ocurrió un error al procesar el reintento de pago';
        toast.error('Error al procesar el pago', { description: errorMsg });
      }
    } catch (err: any) {
      toast.dismiss('retry-payment-toast');
      toast.error('Error con la tarjeta', {
        description: err.message || 'No fue posible validar la tarjeta con la pasarela de pagos',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Redirigir si no hay resultado ni orden en memoria
  if (!paymentResult && !currentOrder) {
    navigate('/');
    return null;
  }

  const orderDate = order?.paidAt || order?.createdAt;
  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('es-CO');

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      {/* Animación inicial a pantalla completa que se desvanece a los 2 segundos de forma muy suave */}
      {splashState !== 'gone' && !isPending && order && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-700 ease-out pointer-events-none ${
            splashState === 'fading'
              ? 'opacity-0 scale-90 -translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <div className="relative flex flex-col items-center">
            {isSuccess ? (
              <div className="flex flex-col items-center">
                <div className="px-8 py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-xl text-emerald-800 text-2xl font-black tracking-tight animate-splash-pop">
                  ¡Pago Exitoso!
                </div>
              </div>
            ) : (
              <>
                <div className="absolute -inset-4 rounded-full bg-rose-100/60 animate-ping" />
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-100 ring-8 ring-rose-50 text-rose-600 flex items-center justify-center shadow-xl animate-splash-pop">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="mt-5 text-xl sm:text-2xl font-black text-gray-900 tracking-tight animate-celebration-card">
                  Pago No Aprobado
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barra de navegación superior (oculta al imprimir) */}
      <div className="print:hidden">
        <AppHeader currentStep={4} />
      </div>

      <main
        className={`max-w-3xl mx-auto px-4 py-8 pb-28 sm:pb-8 print:max-w-none print:p-0 print:m-0 transition-all duration-700 ease-out ${
          splashState === 'showing'
            ? 'opacity-0 translate-y-4'
            : 'opacity-100 translate-y-0'
        }`}
      >
        {isSuccess && order && (
          <>
            {/* Banner de éxito en pantalla */}
            <div className="print:hidden flex flex-col items-center mb-8 animate-celebration-card text-center">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                Transacción Aprobada
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-gray-900 tracking-tight">
                ¡Pago Exitoso y Confirmado!
              </h1>
              <p className="text-gray-600 max-w-md text-xs sm:text-sm">
                Tu transacción fue autorizada exitosamente. Tu pedido ya está programado para despacho y tu comprobante oficial se encuentra listo.
              </p>
            </div>

            {/* Contenedor del Comprobante de Pago (Apto para pantalla e impresión @media print) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6 print:shadow-none print:border-none print:p-0 animate-celebration-card space-y-6">
              {/* 1. Cabecera / Orden */}
              <div className="border-b border-gray-200 pb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Pago Aprobado
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Comprobante de Pago</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      Resumen de la Transacción
                    </h2>
                  </div>
                  <div className="sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Número de Orden</div>
                    <div className="font-mono text-base sm:text-lg font-bold text-gray-900">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Fecha: {formattedDate}</div>
                  </div>
                </div>
              </div>

              {/* 2. Resumen del Pago (en la parte superior) */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200/80 p-5 print:bg-white print:border-gray-200">
                <div className="flex items-center justify-between mb-3 border-b border-gray-200/80 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    Resumen de Pago
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Moneda: {order.currency || 'COP'}</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal productos:</span>
                    <span className="font-mono text-gray-900 font-medium">
                      {formatCOP(order.subtotalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>IVA liquidado (19%):</span>
                    <span className="font-mono text-gray-900 font-medium">
                      {formatCOP(order.taxAmount)}
                    </span>
                  </div>

                  {Number(order.feeAmount) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tarifa de servicio:</span>
                      <span className="font-mono text-gray-900 font-medium">
                        {formatCOP(order.feeAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Costo de envío / domicilio:</span>
                    <span className="font-mono font-medium">
                      {Number(order.deliveryFeeAmount) === 0 ? (
                        <span className="text-emerald-600 font-bold">Gratis</span>
                      ) : (
                        formatCOP(order.deliveryFeeAmount)
                      )}
                    </span>
                  </div>

                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento aplicado:</span>
                      <span className="font-mono font-medium">
                        -{formatCOP(order.discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm sm:text-base font-extrabold pt-3 mt-1 border-t border-gray-200 text-gray-900">
                    <span>Total Pagado:</span>
                    <span className="text-lg sm:text-xl font-black text-blue-700 font-mono print:text-black">
                      {formatCOP(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Productos */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">
                  Productos Adquiridos ({order.items?.length || 0})
                </h3>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => {
                      const unitPrice = Number(item.unitPrice || 0);
                      const quantity = Number(item.quantity || 1);
                      const itemTotal = Number(item.totalAmount || unitPrice * quantity);

                      return (
                        <div key={item.productId || index} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold text-xs">
                                {item.productName ? item.productName.slice(0, 2).toUpperCase() : 'PR'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {quantity} {quantity === 1 ? 'unidad' : 'unidades'} × {formatCOP(unitPrice)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 font-mono font-bold text-xs sm:text-sm text-gray-900">
                            {formatCOP(itemTotal)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500 italic">
                      No hay productos registrados en la orden.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Método de Pago */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">
                  Método de Pago
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Medio de Pago:</dt>
                    <dd className="font-semibold text-gray-900">
                      {tx?.paymentMethod === 'CARD' ? 'Tarjeta de Crédito / Débito' : (tx?.paymentMethod || 'Tarjeta de Crédito / Débito')}
                    </dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Cuotas diferidas:</dt>
                    <dd className="font-semibold text-gray-900">
                      {tx?.installments ? `${tx.installments} cuota(s)` : '1 cuota'}
                    </dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Referencia de Transacción:</dt>
                    <dd className="font-mono font-medium text-gray-900 break-all">
                      {tx?.reference || order.orderNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Estado de la Transacción:</dt>
                    <dd className="font-bold text-emerald-700">
                      APROBADO
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 5. Dirección y Datos de Entrega */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">
                  Dirección y Datos de Entrega
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Destinatario:</dt>
                    <dd className="font-semibold text-gray-900">{order.customerName}</dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Teléfono de contacto:</dt>
                    <dd className="font-semibold text-gray-900">
                      {order.customerPhone}
                      {order.customerPhoneExtension ? ` ext. ${order.customerPhoneExtension}` : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Dirección de entrega:</dt>
                    <dd className="font-semibold text-gray-900">
                      {order.deliveryAddress}
                      {order.deliveryNeighborhood ? `, ${order.deliveryNeighborhood}` : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between sm:flex-col gap-0.5 bg-white p-2.5 rounded-lg border border-gray-100">
                    <dt className="text-gray-500 text-xs">Ciudad y Ubicación:</dt>
                    <dd className="font-semibold text-gray-900">
                      {order.deliveryCity}, {order.deliveryDepartment || 'Antioquia'}, {order.deliveryCountry || 'Colombia'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Aviso de correo enviado */}
            {order.customerEmail && (
              <div className="print:hidden bg-primary-50 border border-primary-200 rounded-xl p-3.5 w-full mb-6 text-center">
                <p className="text-xs sm:text-sm text-primary-900">
                  Hemos enviado el comprobante oficial y la confirmación de tu pedido a{' '}
                  <span className="font-bold underline">{order.customerEmail}</span>.
                </p>
              </div>
            )}

            {/* Botones de acción en pantalla (Ocultos al imprimir en desktop) */}
            <div className="print:hidden hidden sm:flex sm:flex-row gap-3 w-full">
              <button
                onClick={handlePrint}
                className="flex-1 bg-white border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-bold py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center shadow-sm"
              >
                Imprimir Comprobante
              </button>

              <button
                onClick={handleStartOver}
                className="flex-1 btn-primary font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center"
              >
                Seguir Comprando
              </button>
            </div>

            {/* Barra de acción fija en mobile */}
            <div className="print:hidden sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-3 bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl flex items-center justify-center shrink-0 active:scale-95"
              >
                Imprimir
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 btn-primary font-bold py-3 px-4 rounded-xl text-sm shadow-md"
              >
                Seguir Comprando
              </button>
            </div>
          </>
        )}

        {isPending && !isSuccess && order && (
          <div className="flex flex-col items-center">
            {/* Indicador animado sobrio */}
            <div className="relative flex items-center justify-center w-20 h-20 mb-4">
              <div className="absolute animate-ping w-16 h-16 rounded-full bg-primary-300 opacity-20"></div>
              <div className="relative w-14 h-14 rounded-full bg-primary-50 border-2 border-primary-600 flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7 text-primary-600 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
              En validación con la entidad financiera
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center text-gray-900 tracking-tight">
              Procesando tu Pago
            </h1>

            <p className="text-gray-600 text-center max-w-lg text-xs sm:text-sm mb-6 leading-relaxed">
              Hemos recibido tu orden y la entidad financiera está validando la transacción. No te preocupes: te mantendremos informado en todo momento.
            </p>

            {/* Tarjeta de estado de la transacción en curso */}
            <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-gray-100 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Orden de Compra</div>
                  <div className="font-mono text-base font-bold text-gray-900">{order.orderNumber}</div>
                  <div className="text-xs font-semibold text-blue-700 mt-0.5">
                    Estado: Esperando confirmación bancaria
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-gray-500">Total a Pagar</div>
                  <div className="text-lg font-bold text-blue-700 font-mono">{formatCOP(order.totalAmount)}</div>
                  {tx?.reference && (
                    <div className="text-[11px] text-gray-400 font-mono">
                      Ref: {tx.reference}
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje de tranquilidad y notificación por correo */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-4 text-left">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-primary-600 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      Te notificaremos por correo electrónico
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      Puedes cerrar esta página o continuar navegando con total libertad. Tan pronto se confirme el resultado del pago, recibirás una notificación detallada y la factura electrónica en tu correo:
                    </p>
                    {order.customerEmail && (
                      <p className="text-xs font-semibold text-primary-700 bg-white border border-primary-200 rounded-lg px-2.5 py-1.5 inline-block">
                        {order.customerEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Destino y datos de entrega */}
              <div className="text-xs text-gray-500 pt-2 flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-gray-100">
                <span>Dirección de entrega:</span>
                <span className="font-medium text-gray-800 sm:text-right">
                  {order.deliveryAddress}, {order.deliveryCity}
                </span>
              </div>
            </div>

            {/* Botones de acción principales (Desktop) */}
            <div className="hidden sm:flex sm:flex-row gap-3 w-full">
              <button
                onClick={() => navigate('/')}
                className="flex-1 btn-primary py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center text-sm font-bold"
              >
                Seguir Comprando
              </button>
              <button
                onClick={() => navigate(`/orders/track/${order.orderNumber}?token=${order.accessToken}`)}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center text-sm shadow-sm"
              >
                Consultar Estado del Pedido
              </button>
            </div>

            {/* Barra de acción fija en mobile para estado pendiente */}
            <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 btn-primary py-3 px-3 rounded-xl text-xs font-bold text-center"
              >
                Seguir Comprando
              </button>
              <button
                onClick={() => navigate(`/orders/track/${order.orderNumber}?token=${order.accessToken}`)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-3 rounded-xl text-xs text-center"
              >
                Consultar Estado
              </button>
            </div>

            <p className="text-center text-[12px] text-gray-400 mt-3">
              Si decides permanecer en esta pantalla, se actualizará automáticamente una vez recibida la confirmación.
            </p>
          </div>
        )}

        {!isSuccess && !isPending && order && (
          <div className="flex flex-col items-center">
            {/* Ícono de pago fallido armonizado */}
            <div className="w-20 h-20 rounded-full bg-rose-100 ring-8 ring-rose-50/80 flex items-center justify-center mb-3 shadow-sm animate-success-bounce">
              <svg className="w-10 h-10 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wider mb-2 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Transacción No Aprobada
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-center text-gray-900 tracking-tight">
              Pago No Aprobado
            </h1>

            <p className="text-gray-600 text-center max-w-md text-xs sm:text-sm mb-6">
              {(() => {
                const msg = typeof paymentResult?.message === 'string' ? paymentResult.message : '';
                if (!msg || msg.toLowerCase().includes('procesado') || msg.toLowerCase().includes('pendiente')) {
                  return 'La transacción no fue autorizada por la entidad financiera. No te preocupes, tus productos siguen reservados y puedes intentar el pago con otra tarjeta.';
                }
                return msg;
              })()}
            </p>

            {/* Tarjeta de estado de la orden y vigencia para reintento */}
            <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-gray-100 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Orden de Compra</div>
                  <div className="font-mono text-base font-bold text-gray-900">{order.orderNumber}</div>
                  <div className="text-xs font-semibold text-amber-700 mt-0.5">
                    Estado de la orden: Pendiente de Pago
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-gray-500">Total a Pagar</div>
                  <div className="text-lg font-bold text-blue-700 font-mono">{formatCOP(order.totalAmount)}</div>
                  {tx?.reference && (
                    <div className="text-[11px] text-gray-400 font-mono">
                      Ref. transacción: {tx.reference} ({tx.status || 'DECLINED'})
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de vigencia sin timer en vivo */}
              {isOrderCancelled ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-xs text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-800 text-sm mb-1">
                    <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Orden cancelada</span>
                  </div>
                  <p className="leading-relaxed text-rose-800">
                    Esta orden ha sido cancelada y el inventario ha sido liberado. Por favor inicia un nuevo proceso de compra.
                  </p>
                </div>
              ) : !isOrderExpired ? (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm mb-1">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reserva de orden activa (vigencia de 15 minutos)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Tus artículos y precios están garantizados durante 15 minutos para que completes tu transacción con tranquilidad. Puedes reintentar el pago con otra tarjeta.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 rounded-xl p-3.5 mb-4 text-gray-700 text-xs">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Orden expirada</div>
                  <p>
                    El tiempo de reserva ha concluido. Puedes reiniciar tu compra desde el catálogo.
                  </p>
                </div>
              )}

              {/* Lista compacta de productos con fotos */}
              <div className="space-y-3 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Productos en tu pedido
                </p>
                {order.items?.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{item.productName}</div>
                        <div className="text-xs text-gray-500">{item.quantity} unidad(es)</div>
                      </div>
                    </div>
                    <span className="font-mono text-gray-900 font-semibold">{formatCOP(item.totalAmount)}</span>
                  </div>
                ))}
              </div>

              {/* Destino de envío */}
              <div className="text-xs text-gray-500 pt-2 flex justify-between">
                <span>Dirección de envío:</span>
                <span className="font-medium text-gray-800 text-right">
                  {order.deliveryAddress}, {order.deliveryCity}
                </span>
              </div>
            </div>

            {/* Botones de acción para reintento (Desktop) */}
            <div className="hidden sm:block w-full space-y-3">
              {!isOrderExpired && !isOrderCancelled && canRetry && (
                <button
                  onClick={() => setIsRetryModalOpen(true)}
                  className="w-full btn-primary font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Cambiar método de pago
                </button>
              )}

              <button
                onClick={handleStartOver}
                className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center ${
                  isOrderExpired || isOrderCancelled
                    ? 'btn-primary shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isOrderCancelled ? 'Iniciar un Nuevo Pedido' : 'Volver a la Tienda'}
              </button>
            </div>

            {/* Barra de acción fija en mobile para reintento */}
            <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg flex gap-2">
              <button
                onClick={handleStartOver}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-3 rounded-xl text-xs text-center active:scale-95"
              >
                {isOrderCancelled ? 'Nuevo Pedido' : 'Volver a la Tienda'}
              </button>
              {!isOrderExpired && !isOrderCancelled && canRetry && (
                <button
                  onClick={() => setIsRetryModalOpen(true)}
                  className="flex-1 btn-primary font-bold py-3 px-3 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reintentar pago
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer info (Oculto al imprimir) */}
        <div className="print:hidden text-center mt-6">
          <p className="text-xs text-gray-400">
            ¿Tienes dudas sobre tu pedido? Contáctanos a soporte@jhzshop.com ·{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Ver Términos y Condiciones
            </a>
          </p>
        </div>
      </main>

      {/* Modal interactivo para reintentar el pago con otra tarjeta de crédito / débito */}
      <CreditCardModal
        isOpen={isRetryModalOpen}
        onClose={() => setIsRetryModalOpen(false)}
        onSubmit={handleRetryPayment}
        isSubmitting={isRetrying}
        merchantPermalink={merchantData?.permalink}
      />
    </div>
  );
};
