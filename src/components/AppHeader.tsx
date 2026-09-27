import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleCart, selectCartCount, selectCartSubtotal } from '../store/slices/cartSlice';
import { StepProgress } from './StepProgress';
import { CheckoutStep } from '../types';
import { formatCOP } from '../utils/currency';

interface AppHeaderProps {
  /** Pass undefined to hide step progress (e.g. on product page) */
  currentStep?: CheckoutStep;
  showBack?: boolean;
  onBack?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentStep,
  showBack = false,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartCount = useAppSelector(selectCartCount);
  const cartSubtotal = useAppSelector(selectCartSubtotal);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: back or logo */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={handleBack}
                aria-label="Volver"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                  <path d="M2 7h20" />
                  <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight block leading-tight">
                  Jhz<span className="text-blue-600">Shop</span>
                </span>
              </div>
            </button>
          </div>

          {/* Right: cart button */}
          <div className="flex items-center gap-3">
            {(!currentStep || currentStep === 1) && (
              <button
                onClick={() => dispatch(toggleCart())}
                aria-label={`Abrir carrito. ${cartCount} productos`}
                className="relative flex items-center gap-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-800 px-3.5 py-2 rounded-2xl transition-all"
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>

                {/* Subtotal shown on tablet & desktop */}
                <div className="hidden sm:block text-left">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block leading-none">
                    Carrito
                  </span>
                  <span className="text-xs font-bold text-gray-900 leading-none">
                    {cartCount > 0 ? formatCOP(cartSubtotal) : '$0'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Step progress bar (steps 2-4) centered nicely */}
        {currentStep && currentStep >= 2 && currentStep <= 4 && (
          <div className="max-w-xl mx-auto pb-4 pt-1">
            <StepProgress currentStep={currentStep} />
          </div>
        )}
      </div>
    </header>
  );
};
