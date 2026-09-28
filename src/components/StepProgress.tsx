import React from 'react';
import { CheckoutStep } from '../types';

interface StepProgressProps {
  currentStep: CheckoutStep;
}

interface StepConfig {
  step: CheckoutStep;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const STEPS: StepConfig[] = [
  {
    step: 1,
    label: 'Carrito',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    step: 2,
    label: 'Entrega',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    step: 3,
    label: 'Pago',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    step: 4,
    label: 'Resumen',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progreso del proceso de compra" className="w-full px-2 sm:px-4 py-1">
      <ol className="flex items-center justify-between relative">
        {STEPS.map(({ step, label, icon: IconComponent }, idx) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <li key={step} className="flex-1 flex flex-col items-center relative group">
              {/* Connecting line between steps */}
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute top-4 sm:top-4.5 left-1/2 w-full h-[2px] -translate-y-1/2 transition-colors duration-300"
                  style={{
                    backgroundColor: isCompleted ? '#4f46e5' : '#e5e7eb',
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Step Circle with Icon */}
              <div
                className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isActive
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-sm scale-105'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  // Completed: Checkmark
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  // Active or upcoming: render the step icon
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-1.5 text-[10px] sm:text-xs text-center transition-colors truncate max-w-[70px] sm:max-w-none ${
                  isActive
                    ? 'font-bold text-primary-700'
                    : isCompleted
                    ? 'font-semibold text-gray-700'
                    : 'font-medium text-gray-400'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
