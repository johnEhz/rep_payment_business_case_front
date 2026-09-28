import React from 'react';
import { CheckoutStep } from '../types';

interface StepProgressProps {
  currentStep: CheckoutStep;
}

interface StepConfig {
  step: CheckoutStep;
  label: string;
}

const STEPS: StepConfig[] = [
  { step: 1, label: 'Carrito' },
  { step: 2, label: 'Entrega' },
  { step: 3, label: 'Pago' },
  { step: 4, label: 'Resumen' },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progreso del proceso de compra" className="w-full px-2 sm:px-4 py-1">
      <ol className="flex items-center justify-between relative">
        {STEPS.map(({ step, label }, idx) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <li key={step} className="flex-1 flex flex-col items-center relative group">
              {/* Connecting line between steps */}
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute top-3.5 sm:top-4 left-1/2 w-full h-[2px] -translate-y-1/2 transition-colors duration-300"
                  style={{
                    backgroundColor: isCompleted ? '#4f46e5' : '#e5e7eb',
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Step Circle with Number or checkmark */}
              <div
                className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isActive
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-sm scale-105'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? '✓' : step}
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
