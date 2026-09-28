import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleCart, selectCartCount, selectCartSubtotal } from '../store/slices/cartSlice';
import { clearOrder } from '../store/slices/orderSlice';
import { resetCheckout } from '../store/slices/checkoutSlice';
import { clearAllStorage } from '../utils/session';
import { StepProgress, CHECKOUT_STEPS } from './StepProgress';
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

  const [showStepTooltip, setShowStepTooltip] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  const hasStepper = Boolean(currentStep && currentStep >= 2 && currentStep <= 4);
  const currentStepConfig = CHECKOUT_STEPS.find((s) => s.step === currentStep);

  // Smooth scroll hide/show animation
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollY.current;

          // Always visible near the top of the page
          if (currentY <= 30) {
            setIsHeaderHidden(false);
          } else if (diff > 8 && currentY > 50) {
            // Scrolling down -> hide header
            setIsHeaderHidden(true);
            setShowStepTooltip(false);
          } else if (diff < -8) {
            // Scrolling up -> show header
            setIsHeaderHidden(false);
          }

          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs transition-transform duration-300 ease-in-out ${
        isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {hasStepper ? (
          <div className="py-2.5 sm:py-3 max-w-xl mx-auto">
            {/* Top Row: Back button (Left), Step title (Center), Tooltip (Right) matching reference */}
            <div className="flex items-center justify-between relative mb-2 sm:mb-2.5">
              {/* Back Button */}
              {showBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Volver"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              ) : (
                <div className="w-8 h-8 shrink-0" />
              )}

              {/* Centered Current Step Title */}
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center tracking-tight truncate px-2">
                {currentStepConfig?.label || 'Proceso de compra'}
              </h2>

              {/* Informative Tooltip (?) Button */}
              <div className="relative shrink-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowStepTooltip((prev) => !prev)}
                  onMouseEnter={() => setShowStepTooltip(true)}
                  onMouseLeave={() => setShowStepTooltip(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center text-gray-600 text-xs font-bold transition-colors cursor-pointer"
                  title="Información sobre este paso"
                  aria-label="Información sobre este paso"
                >
                  ?
                </button>

                {showStepTooltip && (
                  <div
                    role="tooltip"
                    className="absolute right-0 top-full mt-2 z-50 w-64 p-3 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl pointer-events-none animate-in fade-in duration-150 text-left"
                  >
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45" />
                    <p className="font-bold text-white mb-0.5">{currentStepConfig?.label}</p>
                    <p className="text-gray-300">{currentStepConfig?.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Connected Circles */}
            <StepProgress currentStep={currentStep!} />
          </div>
        ) : (
          /* Catalog View: Always shows full logo + cart */
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
