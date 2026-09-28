import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleCart, selectCartCount, selectCartSubtotal } from '../store/slices/cartSlice';
import { clearOrder } from '../store/slices/orderSlice';
import { resetCheckout } from '../store/slices/checkoutSlice';
import { clearAllStorage } from '../utils/session';
import { StepProgress } from './StepProgress';
import { CheckoutStep } from '../types';
import { formatCOP } from '../utils/currency';

interface AppHeaderProps {
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

  const hasStepper = Boolean(currentStep && currentStep >= 2 && currentStep <= 4);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleLogoClick = () => {
    if (currentStep === 4) {
      clearAllStorage();
      dispatch(clearOrder());
      dispatch(resetCheckout());
    }
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {hasStepper ? (
          <div>
            {/* Mobile View: Hide logo & brand name outside catalog, unify back button + stepper in 1 single compact row */}
            <div className="sm:hidden flex items-center gap-1.5 h-13 py-1">
              {showBack && (
                <button
                  onClick={handleBack}
                  aria-label="Volver"
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <StepProgress currentStep={currentStep!} />
              </div>
            </div>

            {/* Desktop / Tablet View: Logo + Back Button in top row, Stepper cleanly placed below */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between h-15">
                <div className="flex items-center gap-3">
                  {showBack && (
                    <button
                      onClick={handleBack}
                      aria-label="Volver"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
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
                    onClick={handleLogoClick}
                    className="flex items-center gap-2 text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-violet text-white flex items-center justify-center shadow-xs">
                      <span className="font-black text-sm">J</span>
                    </div>
                    <span className="font-bold text-gray-900 text-base tracking-tight">
                      Jhz<span className="text-primary-600">Shop</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="max-w-xl mx-auto pb-2">
                <StepProgress currentStep={currentStep!} />
              </div>
            </div>
          </div>
        ) : (
          /* Catalog View (Home/Store): Full header with logo and cart trigger */
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-violet text-white flex items-center justify-center shadow-xs shadow-primary-500/30 group-hover:scale-105 transition-transform">
                <span className="font-black text-base">J</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm sm:text-lg tracking-tight block leading-tight">
                  Jhz<span className="text-primary-600">Shop</span>
                </span>
              </div>
            </button>

            {/* Cart trigger button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(toggleCart())}
                aria-label={`Abrir carrito. ${cartCount} productos`}
                className="relative flex items-center gap-2.5 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 text-gray-800 px-3.5 py-2 rounded-2xl transition-all cursor-pointer"
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
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <span className="text-[10px] text-gray-400 font-bold block leading-none">
                    Carrito
                  </span>
                  <span className="text-xs font-bold text-gray-900 leading-none">
                    {cartCount > 0 ? formatCOP(cartSubtotal) : '$0'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
