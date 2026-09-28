import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../store';
import {
  removeItem,
  updateQuantity,
  clearCart,
  closeCart,
  selectCartItems,
  selectCartSubtotal,
} from '../store/slices/cartSlice';
import { clearPreviewError } from '../store/slices/checkoutSlice';
import { formatCOP } from '../utils/currency';

const PLACEHOLDER_IMAGE = 'https://placehold.co/80x80/f3f4f6/9ca3af?text=?';

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector((s) => s.cart.isOpen);
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const stockError = useAppSelector((s) => s.checkout.stockError);
  const isEmpty = items.length === 0;

  // Animación fluida de entrada y salida del carrito
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const raf = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const hasOverstockedItems = items.some((i) => i.quantity > i.product.stock);

  const handleCheckout = () => {
    if (hasOverstockedItems) {
      toast.error('Tienes productos que superan el stock disponible. Ajusta las cantidades antes de continuar.');
      return;
    }
    dispatch(closeCart());
    navigate('/checkout');
  };

  // Trap focus / mount only when active or animating
  if (!isRendered) return null;

  return (
    <>
      {/* Backdrop con fade in / fade out */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => dispatch(closeCart())}
        aria-hidden="true"
      />

      {/* Drawer con slide-in / slide-out suave desde la derecha */}
      <aside
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ maxWidth: '380px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="font-bold text-gray-900 text-lg">Tu carrito</h2>
            {!isEmpty && (
              <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch(closeCart())}
            aria-label="Cerrar carrito"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {(hasOverstockedItems || stockError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-bold text-red-800">
                {stockError?.productName ? `Stock insuficiente para ${stockError.productName}` : 'Stock superado'}
              </p>
              <p className="mt-0.5">
                {stockError?.message ||
                  'Algunos productos superan las unidades disponibles en inventario. Reduce la cantidad para poder proceder al pago.'}
              </p>
            </div>
          )}

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <svg className="w-16 h-16 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <button
                onClick={() => dispatch(closeCart())}
                className="text-primary-600 font-semibold text-sm hover:text-primary-700"
              >
                Explorar productos →
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isOverStock = item.quantity > item.product.stock;
              const isMaxStock = item.quantity === item.product.stock;

              return (
                <div
                  key={item.productId}
                  className={`flex gap-3 rounded-xl p-3 transition-colors ${
                    isOverStock ? 'bg-red-50/80 border border-red-200' : 'bg-gray-50'
                  }`}
                >
                  <img
                    src={item.product.imageUrl || PLACEHOLDER_IMAGE}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2">
                      {item.product.name}
                    </p>
                    <p className="text-primary-600 font-bold text-sm mt-0.5">
                      {formatCOP(item.product.priceInCents * item.quantity)}
                    </p>

                    {/* Stock indicators */}
                    {isOverStock && (
                      <span className="text-[10px] text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                        Supera stock ({item.product.stock} disp.)
                      </span>
                    )}
                    {isMaxStock && !isOverStock && (
                      <span className="text-[10px] text-amber-700 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
                        Máx. disponible ({item.product.stock})
                      </span>
                    )}

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          dispatch(clearPreviewError());
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity - 1,
                            })
                          );
                        }}
                        aria-label="Disminuir cantidad"
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-gray-900 min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity >= item.product.stock) {
                            toast.warning(
                              `Solo hay ${item.product.stock} unidades disponibles de "${item.product.name}"`
                            );
                            return;
                          }
                          dispatch(clearPreviewError());
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                            })
                          );
                        }}
                        aria-label="Aumentar cantidad"
                        className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold ${
                          item.quantity >= item.product.stock ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          dispatch(clearPreviewError());
                          dispatch(removeItem(item.productId));
                        }}
                        aria-label={`Eliminar ${item.product.name}`}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-gray-900 font-bold text-lg">{formatCOP(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              El costo de envío se calculará con tu dirección de entrega
            </p>
            <button
              onClick={handleCheckout}
              disabled={hasOverstockedItems}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasOverstockedItems ? 'Ajusta el stock para continuar' : 'Proceder al pago'}
            </button>
            <button
              onClick={() => {
                dispatch(clearCart());
              }}
              className="w-full text-center text-red-500 text-sm font-medium hover:text-red-700 transition-colors py-1"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
