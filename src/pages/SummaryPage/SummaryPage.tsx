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
      toast.warning('Por favor ingresa los datos de tu tarjeta para confirmar');
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
        <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-32 lg:pb-12">
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

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-36 lg:pb-12">
        {/* Header title */}
        <div className="mb-5 sm:mb-6">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Resumen y Confirmación de Pago
            </h1>
            <span className="text-xs sm:text-sm font-mono text-gray-400 font-medium">
              #{currentOrder.orderNumber}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Column 1: Order Items, Payment Method, Delivery Address (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Products in this order */}
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    Artículos en el pedido
                  </h2>
                  <span className="text-xs text-gray-400 font-normal">
                    ({currentOrder.items?.reduce((s, i) => s + i.quantity, 0)} uds)
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(currentOrder.items || []).map((item) => {
                  const imgUrl =
                    preview?.items?.find((p) => p.productId === item.productId)?.imageUrl ||
                    cartItems.find((c) => c.productId === item.productId)?.product.imageUrl ||
                    products.find((p) => p.id === item.productId)?.imageUrl ||
                    products.find((p) => p.id === item.productId)?.images?.[0];
                  return (
                    <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center">
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
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Cantidad: <span className="font-semibold text-gray-700">{item.quantity}</span> × {formatCOP(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block font-mono">
                          {formatCOP(item.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Details with "Editar" button */}
            {cardInfo && (
              <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">
                    Método de Pago
                  </h2>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Editar</span>
                  </button>
                </div>

                {/* Harmonized Indigo/Violet Card Preview */}
                <div
                  className={`relative rounded-2xl p-4 sm:p-5 text-white overflow-hidden shadow-xl border transition-all ${
                    cardBrand === 'mastercard'
                      ? 'bg-gradient-to-br from-indigo-700 via-purple-800 to-rose-900 border-purple-400/30 shadow-purple-900/25'
                      : cardBrand === 'visa'
                      ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 border-indigo-400/30 shadow-indigo-900/25'
                      : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-950 border-indigo-400/25 shadow-indigo-950/25'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-white/[0.12] pointer-events-none rounded-2xl" />

                  {/* Top: Wallet & Cardholder */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-[10px] font-semibold text-white/50 tracking-wider block">
                        Wallet
                      </span>
                      <p className="text-sm sm:text-base font-medium text-white/95 truncate max-w-[200px]">
                        {cardInfo.cardHolder}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] border border-white/10">
                        {cardInfo.installments} {cardInfo.installments === 1 ? 'cuota' : 'cuotas'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Number & Logo */}
                  <div className="flex items-end justify-between relative z-10 pt-4">
                    <div>
                      <p className="font-mono text-sm sm:text-base font-bold tracking-widest text-white">
                        •••• •••• •••• {last4}
                      </p>
                      <p className="text-[10px] font-mono text-white/50 mt-0.5">
                        Account ** {last4}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {cardBrand === 'mastercard' && (
                        <div className="flex items-center -space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                          <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
                        </div>
                      )}
                      {cardBrand === 'visa' && (
                        <span className="text-base font-black italic tracking-widest text-white">
                          VISA
                        </span>
                      )}
                      {cardBrand === 'unknown' && (
                        <span className="text-[10px] font-mono text-white/40">TARJETA</span>
                      )}
                      <span className="font-mono text-[9px] text-white/50 tracking-wider">
                        **** {last4}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buyer Contact & Structured Delivery Address with "Editar" button */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">
                  Datos de Entrega
                </h2>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-xs font-medium mb-0.5">
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
                  <span className="text-gray-400 block text-xs font-medium mb-0.5">
                    Dirección
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

              {/* Integrated terms acceptance note */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] text-gray-500">
                  Términos y condiciones aceptados para esta compra
                </span>
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

          {/* Column 2: Financial Breakdown and Desktop Action (lg:col-span-5) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="card p-4 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100">
                Resumen de Pago
              </h2>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal base (sin IVA)</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {formatCOP(currentOrder.subtotalAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%)</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {formatCOP(currentOrder.taxAmount || 0)}
                  </span>
                </div>

                {/* Service Fee */}
                {Number(currentOrder.feeAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tarifa de servicio</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      {formatCOP(currentOrder.feeAmount || 0)}
                    </span>
                  </div>
                )}

                {/* Delivery fee */}
                <div className="flex justify-between text-gray-600">
                  <span>Costo de envío</span>
                  <span className="font-semibold text-gray-900">
                    {currentOrder.deliveryFeeAmount === 0 ? (
                      <span className="text-emerald-600 font-bold">¡Envío Gratis!</span>
                    ) : (
                      formatCOP(currentOrder.deliveryFeeAmount)
                    )}
                  </span>
                </div>

                {/* Highlighted Total Box */}
                <div className="bg-primary-50/80 border border-primary-200/80 rounded-xl p-3.5 mt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-primary-950">Total a pagar</span>
                  <span className="text-xl sm:text-2xl font-black text-primary-700 font-mono">
                    {formatCOP(currentOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Desktop Confirm and Pay Button - ONLY pay button */}
              <div className="hidden lg:block mt-6 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndPay}
                  disabled={isProcessing || merchantLoading}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold shadow-md shadow-primary-500/25 text-sm rounded-xl cursor-pointer hover:shadow-lg transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Spinner size="sm" color="text-white" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <span>Confirmar y Pagar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Full-Width Fixed Bottom Bar - ONLY pay button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 pb-5 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={handleConfirmAndPay}
            disabled={isProcessing || merchantLoading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md rounded-xl active:scale-95 transition-transform"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" color="text-white" />
                <span>{tokenizing ? 'Validando tarjeta...' : 'Procesando...'}</span>
              </>
            ) : (
              <span>Confirmar y Pagar • {formatCOP(currentOrder.totalAmount)}</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
