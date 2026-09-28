import React from 'react';
import { CheckoutStep } from '../types';

interface StepProgressProps {
  currentStep: CheckoutStep;
}

export interface StepConfig {
  step: CheckoutStep;
  label: string;
  description: string;
}

export const CHECKOUT_STEPS: StepConfig[] = [
  {
    step: 1,
    label: 'Carrito de compras',
    description: 'Revisa y ajusta los productos seleccionados en tu carrito antes de procesar la orden.',
  },
  {
    step: 2,
    label: 'Contacto y pago',
    description: 'Ingresa tus datos personales, dirección de entrega en el Valle de Aburrá y los datos de tu tarjeta de crédito.',
  },
  {
    step: 3,
    label: 'Resumen de la orden',
    description: 'Verifica los costos de entrega, productos y método de pago antes de confirmar y procesar la compra.',
  },
  {
    step: 4,
    label: 'Confirmación',
    description: 'Comprobante y resultado del procesamiento de tu pago y envío.',
  },
];

interface StepProgressProps {
  currentStep: CheckoutStep;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, className = '' }) => {
  return (
    <nav aria-label="Progreso del proceso de compra" className={`w-full max-w-xs sm:max-w-sm mx-auto ${className}`}>
      <ol className="flex items-center justify-between relative">
        {CHECKOUT_STEPS.map(({ step }, idx) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <li key={step} className="flex-1 flex items-center justify-center relative">
              {/* Connecting line between steps */}
              {idx < CHECKOUT_STEPS.length - 1 && (
                <div
                  className="absolute top-1/2 left-1/2 w-full h-[2.5px] -translate-y-1/2 transition-colors duration-300"
                  style={{
                    backgroundColor: isCompleted ? '#2563eb' : '#e5e7eb',
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Step Circle */}
              <div
                className={`relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : isActive
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-xs scale-105'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
