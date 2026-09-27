import React from 'react';
import { CheckoutStep } from '../types';

interface StepProgressProps {
  currentStep: CheckoutStep;
}

const STEPS: { step: CheckoutStep; label: string }[] = [
  { step: 1, label: 'Productos' },
  { step: 2, label: 'Tarjeta y Entrega' },
  { step: 3, label: 'Resumen' },
  { step: 4, label: 'Estado final' },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progreso del proceso de compra" className="w-full">
      <ol className="flex items-center justify-between">
        {STEPS.map(({ step, label }, idx) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;
          return (
            <li key={step} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute top-4 left-1/2 w-full h-0.5"
                  style={{
                    backgroundColor: isCompleted ? '#2563eb' : '#e5e7eb',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Step circle */}
              <div
                className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  backgroundColor: isCompleted
                    ? '#2563eb'
                    : isActive
                    ? '#eff6ff'
                    : '#f3f4f6',
                  color: isCompleted ? '#ffffff' : isActive ? '#2563eb' : '#9ca3af',
                  border: isActive ? '2px solid #2563eb' : '2px solid transparent',
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>

              {/* Label */}
              <span
                className="mt-1.5 text-xs font-medium text-center hidden sm:block"
                style={{ color: isActive || isCompleted ? '#1d4ed8' : '#9ca3af' }}
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
