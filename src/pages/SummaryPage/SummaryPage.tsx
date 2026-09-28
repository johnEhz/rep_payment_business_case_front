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
import { PaymentCardVisual } from '../../components/PaymentCardVisual';

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

  // Guard: if order is already paid, or no order or missing card info, redirect appropriately
  useEffect(() => {
    if (currentOrder?.status === 'PAID' || currentOrder?.status === 'DELIVERED') {
      toast.info('Esta orden ya fue procesada exitosamente.');
      navigate('/', { replace: true });
      return;
    }
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
  const cardBrand = cardInfo?.number ? detectCardBrand(cardInfo.number) : 'unknown';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader currentStep={3} showBack onBack={handleBack} />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-44 sm:pb-48 lg:pb-12">
        {/* Order reference number */}
        <div className="mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm font-mono text-gray-500 font-medium">
            Orden #{currentOrder.orderNumber}
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Column 1: Order Items, Payment Method, Delivery Address (lg:col-span-7) */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-4">
            {/* Products in this order */}
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    Artículos
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
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center">
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

                {/* Reusable Physical Payment Card Visual */}
                <PaymentCardVisual
                  cardNumber={cardInfo.number}
                  cardHolder={cardInfo.cardHolder}
                  expMonth={cardInfo.expMonth}
                  expYear={cardInfo.expYear}
                  installments={cardInfo.installments}
                  brand={cardBrand}
                />
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
          <div className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-24 space-y-4">
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

        {/* Extra clearance spacer on mobile so summary can scroll above the fixed payment button */}
        <div className="h-16 lg:hidden" aria-hidden="true" />

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
              <span>Confirmar pago {formatCOP(currentOrder.totalAmount)}</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
