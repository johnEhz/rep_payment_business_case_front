import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store';
import { setStep, fetchMerchantData } from '../../store/slices/checkoutSlice';
import { payOrder } from '../../store/slices/orderSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { AppHeader } from '../../components/AppHeader';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { SummaryPageSkeleton } from '../../components/skeletons/CheckoutSkeleton';
import { formatCOP } from '../../utils/currency';
import { tokenizeCard } from '../../utils/gateway';
import { detectCardBrand } from '../../utils/validators';

export const SummaryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { cardInfo, merchantData, merchantLoading, preview } = useAppSelector(
    (s) => s.checkout
  );
  const { currentOrder, paying, payError } = useAppSelector((s) => s.order);
  const { products } = useAppSelector((s) => s.catalog);
  const cartItems = useAppSelector((s) => s.cart.items);

  const [tokenizing, setTokenizing] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Guard: if no order or missing card info (e.g. lost on hard reload), send back to step 2
  useEffect(() => {
    if (!currentOrder) {
      navigate('/checkout');
      return;
    }
    if (!cardInfo) {
      toast.warning('Por favor ingresa nuevamente los datos de tu tarjeta para confirmar el pago');
      navigate('/checkout');
    }
  }, [currentOrder, cardInfo, navigate]);

  // Ensure merchant data is available for tokenization
  useEffect(() => {
    if (!merchantData) {
      dispatch(fetchMerchantData());
    }
  }, [dispatch, merchantData]);

  const handleConfirmAndPay = async () => {
    if (!currentOrder || !cardInfo || !merchantData || isProcessing) return;

    setTokenizing(true);
    setTokenError(null);

    let cardToken: string;
    try {
      // 1. Tokenize card directly against the gateway
      cardToken = await tokenizeCard(
        {
          number: cardInfo.number,
          cvc: cardInfo.cvc,
          exp_month: cardInfo.expMonth,
          exp_year: cardInfo.expYear,
          card_holder: cardInfo.cardHolder,
        },
        merchantData.publicKey,
        merchantData.gatewayApiUrl
      );
    } catch (err: any) {
      const errMsg = err.message || 'Error al validar los datos de la tarjeta con la pasarela';
      setTokenError(errMsg);
      toast.error('Error de validación de tarjeta', { description: errMsg });
      setTokenizing(false);
      return;
    }

    setTokenizing(false);

    // 2. Execute payment transaction in the gateway for this order with idempotent key
    const payResult = await dispatch(
      payOrder({
        orderNumber: currentOrder.orderNumber,
        accessToken: currentOrder.accessToken,
        acceptanceToken: merchantData.acceptanceToken,
        cardToken,
        installments: cardInfo.installments,
        idempotencyKey: `pay_${currentOrder.orderNumber}_init`,
      })
    );

    if (payOrder.fulfilled.match(payResult)) {
      dispatch(clearCart());
      dispatch(setStep(4));
      navigate('/status');
    } else if (payOrder.rejected.match(payResult)) {
      const errMsg = (payResult.payload as string) || 'Transacción rechazada por la pasarela';
      toast.error('Pago no completado', { description: errMsg });
      dispatch(clearCart());
      dispatch(setStep(4));
      navigate('/status');
    }
  };

  const handleBack = () => {
    navigate('/checkout');
  };

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <AppHeader currentStep={3} />
        <main className="flex-1 max-w-6xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-32 lg:pb-12">
          <div className="mb-4 sm:mb-5 space-y-2">
            <Skeleton className="h-7 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded" />
          </div>
          <SummaryPageSkeleton />
        </main>
      </div>
    );
  }

  const isProcessing = tokenizing || paying;
  const last4 = cardInfo?.number ? cardInfo.number.slice(-4) : '••••';
  const cardBrand = cardInfo?.number ? detectCardBrand(cardInfo.number) : 'unknown';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader currentStep={3} showBack onBack={handleBack} />

      <main className="flex-1 max-w-6xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-32 lg:pb-12">
        {/* Header title */}
        <div className="mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Paso 3: Resumen y Confirmación de Pago
            </h1>
            <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Orden {currentOrder.orderNumber}
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            Verifica el detalle final de tu pedido y confirma el cobro para procesar la transacción.
          </p>
        </div>

        {/* 2-Column Responsive Layout: Order Summary FIRST on mobile (order-1), Right on desktop (order-2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Order Summary / Financial Breakdown (order-1 on mobile, order-2 on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="card p-3.5 sm:p-5">
              <h2 className="text-sm font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100 uppercase tracking-wider">
                Resumen de la orden
              </h2>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal base (sin IVA)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCOP(currentOrder.subtotalAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCOP(currentOrder.taxAmount || 0)}
                  </span>
                </div>

                {/* Service Fee */}
                <div className="flex justify-between text-gray-600">
                  <span>Tarifa de servicio (Fee)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCOP(currentOrder.feeAmount || 0)}
                  </span>
                </div>

                {/* Delivery fee */}
                <div className="flex justify-between text-gray-600">
                  <span>Costo de envío</span>
                  <span className="font-semibold text-gray-900">
                    {currentOrder.deliveryFeeAmount === 0 ? (
                      <span className="text-green-600 font-bold">¡Envío Gratis!</span>
                    ) : (
                      formatCOP(currentOrder.deliveryFeeAmount)
                    )}
                  </span>
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 pt-3.5 mt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Total a pagar</span>
                    <span className="text-[10px] text-gray-400">Impuestos y tarifas incluidos</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-blue-700">
                    {formatCOP(currentOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Desktop Confirm and Pay Button */}
              <div className="hidden lg:block mt-5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndPay}
                  disabled={isProcessing || merchantLoading}
                  className="btn-primary py-3.5 flex items-center justify-center gap-2 font-bold shadow-md shadow-blue-500/10 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Spinner size="sm" color="text-white" />
                      {tokenizing ? 'Validando tarjeta...' : 'Creando transacción y cobrando...'}
                    </>
                  ) : (
                    <>
                      Confirmar y Pagar
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-2">
                  Al confirmar se creará y procesará la transacción de tu compra
                </p>
              </div>
            </div>
          </div>

          {/* Order Items, Buyer and Delivery Details (order-2 on mobile, order-1 on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-4">
            {/* Products in this order */}
            <div className="card p-3.5 sm:p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Artículos incluidos
                  </h2>
                  <span className="text-xs text-gray-400 font-normal">
                    ({currentOrder.items?.reduce((s, i) => s + i.quantity, 0)} uds)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {(currentOrder.items || []).map((item) => {
                  const imgUrl =
                    preview?.items?.find((p) => p.productId === item.productId)?.imageUrl ||
                    cartItems.find((c) => c.productId === item.productId)?.product.imageUrl ||
                    products.find((p) => p.id === item.productId)?.imageUrl ||
                    products.find((p) => p.id === item.productId)?.images?.[0];
                  return (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/100x100/f3f4f6/9ca3af?text=Img';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-gray-400 font-bold">ITEM</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} × {formatCOP(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                        {formatCOP(item.totalAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buyer Contact & Structured Delivery Address */}
            <div className="card p-3.5 sm:p-5">
              <h2 className="text-sm font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100 uppercase tracking-wider">
                Información de entrega y contacto
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Destinatario
                  </span>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">{currentOrder.customerName}</p>
                  <p className="text-gray-600 mt-0.5">{currentOrder.customerEmail}</p>
                  <p className="text-gray-600 mt-0.5">
                    Tel:{' '}
                    {currentOrder.customerPhoneExtension
                      ? `${currentOrder.customerPhoneExtension} `
                      : ''}
                    {currentOrder.customerPhone}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Lugar de entrega
                  </span>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">{currentOrder.deliveryAddress}</p>
                  {currentOrder.deliveryNeighborhood && (
                    <p className="text-gray-600 mt-0.5">Barrio: {currentOrder.deliveryNeighborhood}</p>
                  )}
                  <p className="text-gray-600 mt-0.5">
                    {currentOrder.deliveryCity}, {currentOrder.deliveryDepartment} ({currentOrder.deliveryCountry})
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            {cardInfo && (
              <div className="card p-3.5 sm:p-5">
                <h2 className="text-sm font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100 uppercase tracking-wider">
                  Método de pago seleccionado
                </h2>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    {/* Visual Card Brand Logo (VISA / MasterCard) */}
                    <div className="w-12 h-8 bg-gray-50 rounded-lg border border-gray-200/80 flex items-center justify-center shrink-0 px-1 shadow-2xs">
                      {cardBrand === 'visa' && (
                        <span className="font-black italic text-blue-800 text-sm tracking-wider select-none">
                          VISA
                        </span>
                      )}
                      {cardBrand === 'mastercard' && (
                        <div className="flex items-center -space-x-1.5">
                          <div className="w-4 h-4 rounded-full bg-red-600 opacity-90" />
                          <div className="w-4 h-4 rounded-full bg-amber-500 opacity-90" />
                        </div>
                      )}
                      {cardBrand === 'unknown' && (
                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-xs sm:text-sm">
                          Tarjeta terminada en •••• {last4}
                        </p>
                      </div>
                      <p className="text-gray-500 uppercase text-[11px] mt-0.5 font-mono">{cardInfo.cardHolder}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-[11px] border border-blue-200">
                      {cardInfo.installments} {cardInfo.installments === 1 ? 'cuota' : 'cuotas'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions Acceptance Status */}
            <div className="card p-3.5 sm:p-4 bg-gray-50/60 border border-gray-200/70 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-xs">
                    Términos y condiciones aceptados
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                    Aceptaste los{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      términos y condiciones
                    </a>{' '}
                    de la tienda para esta compra.
                  </p>
                </div>
              </div>
            </div>

            {(tokenError || payError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs">
                {typeof (tokenError || payError) === 'string'
                  ? (tokenError || payError)
                  : JSON.stringify(tokenError || payError)}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Full-Width Fixed Bottom Bar for Instant Payment Action */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-40 shadow-2xl">
          <button
            type="button"
            onClick={handleConfirmAndPay}
            disabled={isProcessing || merchantLoading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" color="text-white" />
                {tokenizing ? 'Validando...' : 'Procesando...'}
              </>
            ) : (
              <>Confirmar y Pagar</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
