import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  creditCardModalSchema,
  CreditCardModalFormValues,
  detectCardBrand,
  CardBrand,
} from '../utils/validators';
import { Spinner } from './ui/Spinner';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: CreditCardModalFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  merchantPermalink?: string;
}

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  merchantPermalink,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreditCardModalFormValues>({
    resolver: zodResolver(creditCardModalSchema),
    mode: 'onChange',
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expMonth: '',
      expYear: '',
      cvc: '',
      installments: 1,
      termsAccepted: false,
    },
  });

  const [expiryDisplay, setExpiryDisplay] = useState('');

  // Explicitly register month and year fields since they are updated via unified input
  useEffect(() => {
    register('expMonth');
    register('expYear');
  }, [register]);

  const cardNumber = watch('cardNumber') || '';
  const cardHolder = watch('cardHolder') || '';
  const expMonth = watch('expMonth') || '';
  const expYear = watch('expYear') || '';
  const brand: CardBrand = detectCardBrand(cardNumber);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setExpiryDisplay('');
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  // Format expiry input dynamically as MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const isDeleting = raw.length < expiryDisplay.length;
    const numbers = raw.replace(/\D/g, '').slice(0, 4);

    let formatted = numbers;
    if (numbers.length >= 3) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length === 2) {
      formatted = !isDeleting ? `${numbers}/` : numbers;
    }

    setExpiryDisplay(formatted);

    const m = numbers.slice(0, 2);
    const y = numbers.slice(2, 4);

    setValue('expMonth', m, { shouldValidate: true, shouldDirty: true });
    setValue('expYear', y, { shouldValidate: true, shouldDirty: true });
  };

  // Format card number display for the simulated visual card
  const displayCardNumber = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) return '••••  ••••  ••••  ••••';
    const padded = digits.padEnd(16, '•');
    return `${padded.slice(0, 4)}  ${padded.slice(4, 8)}  ${padded.slice(8, 12)}  ${padded.slice(12, 16)}`;
  };

  const expiryErrorMessage = errors.expMonth?.message || errors.expYear?.message;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog Content */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 shrink-0 bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Pay with credit card
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              Ingresa los datos de tu tarjeta para reservar tu orden
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Form with Scrollable Content and Fixed Bottom Actions */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable form body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
            {/* Visual Realistic Simulated Card Preview (Compact on Mobile) */}
            <div className="relative h-36 sm:h-44 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900 text-white p-3.5 sm:p-5 shadow-lg flex flex-col justify-between overflow-hidden border border-slate-700/60 shrink-0">
              {/* Subtle glossy light reflection overlay */}
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none rounded-xl sm:rounded-2xl" />

              {/* Top row: Realistic Chip, Contactless Icon, and Brand Logo */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  {/* EMV Gold Chip with Circuit Lines */}
                  <div className="w-9 h-6 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300/80 shadow-xs relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 border-t border-b border-amber-700/30 top-1.5 bottom-1.5 sm:top-2 sm:bottom-2" />
                    <div className="absolute inset-0 border-l border-r border-amber-700/30 left-2.5 right-2.5 sm:left-3 sm:right-3" />
                    <div className="w-3.5 h-2.5 sm:w-4 sm:h-3 border border-amber-800/40 rounded-xs bg-amber-300/40" />
                  </div>

                  {/* Contactless waves symbol */}
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 -rotate-90 opacity-75"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Brand Logo Badge */}
                <div className="flex items-center">
                  {brand === 'visa' && (
                    <div className="bg-white/95 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md shadow-xs flex items-center">
                      <span className="font-extrabold italic tracking-wider text-blue-800 text-xs sm:text-sm">
                        VISA
                      </span>
                    </div>
                  )}

                  {brand === 'mastercard' && (
                    <div className="flex items-center -space-x-1.5 sm:-space-x-2 bg-white/95 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-xs">
                      <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-red-600 opacity-90" />
                      <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-amber-500 opacity-90" />
                    </div>
                  )}

                  {brand === 'unknown' && (
                    <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase">
                      TARJETA
                    </span>
                  )}
                </div>
              </div>

              {/* Card Number display: 4-4-4-4 monospace embossed format */}
              <div className="z-10 my-auto py-0.5">
                <p className="font-mono text-xs sm:text-base md:text-lg font-bold tracking-[0.14em] sm:tracking-[0.2em] text-slate-100 drop-shadow-sm select-none truncate">
                  {displayCardNumber()}
                </p>
              </div>

              {/* Bottom row: Cardholder and Expiry (Month and Year joined by /) */}
              <div className="flex items-end justify-between z-10">
                <div className="min-w-0 flex-1 pr-2 sm:pr-3">
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-slate-400 block mb-0.5">
                    Titular
                  </span>
                  <p className="font-mono text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-slate-200 truncate uppercase">
                    {cardHolder || 'NOMBRE TITULAR'}
                  </p>
                </div>

                {/* Expiry: Month and Year united separated by / */}
                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                  <div className="text-[7px] sm:text-[8px] font-mono uppercase tracking-tighter text-slate-400 leading-tight text-right">
                    <span>VALID</span>
                    <br />
                    <span>THRU</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-widest text-white drop-shadow-xs">
                    <span className={expMonth ? 'text-white' : 'text-slate-500'}>
                      {expMonth || 'MM'}
                    </span>
                    <span className="text-slate-400 mx-0.5">/</span>
                    <span className={expYear ? 'text-white' : 'text-slate-500'}>
                      {expYear || 'AA'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Number with Live Brand Detection Logo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="modalCardNumber"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Número de tarjeta *
                </label>

                {/* Supported brands indicators */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      brand === 'visa'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    VISA
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      brand === 'mastercard'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    MasterCard
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  id="modalCardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 •••• •••• 4242"
                  maxLength={19}
                  className={`input-field font-mono tracking-widest pr-14 ${
                    errors.cardNumber ? 'error' : ''
                  }`}
                  {...register('cardNumber', {
                    onChange: (e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
                    },
                  })}
                />

                {/* Dynamic Brand Logo inside the input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {brand === 'visa' && (
                    <span className="font-extrabold italic text-blue-700 text-sm">
                      VISA
                    </span>
                  )}
                  {brand === 'mastercard' && (
                    <div className="flex items-center -space-x-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-600 opacity-90" />
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-90" />
                    </div>
                  )}
                  {brand === 'unknown' && null}
                </div>
              </div>
              {errors.cardNumber && (
                <p className="error-text">{errors.cardNumber.message}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label
                htmlFor="modalCardHolder"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
              >
                Nombre del titular *
              </label>
              <input
                id="modalCardHolder"
                type="text"
                autoComplete="cc-name"
                placeholder="Nombre como aparece en la tarjeta"
                minLength={5}
                className={`input-field uppercase ${errors.cardHolder ? 'error' : ''}`}
                {...register('cardHolder')}
              />
              {errors.cardHolder && (
                <p className="error-text">{errors.cardHolder.message}</p>
              )}
            </div>

            {/* Expiration (MM/AA united with /) and CVC in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Expiration Date Field: MM/AA */}
              <div>
                <label
                  htmlFor="modalExpiry"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 h-5 flex items-center truncate"
                  title="Fecha de vencimiento (MM/AA)"
                >
                  Vencimiento *
                </label>
                <div className="relative">
                  <input
                    id="modalExpiry"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={expiryDisplay}
                    onChange={handleExpiryChange}
                    className={`input-field text-center font-mono tracking-wider ${
                      expiryErrorMessage ? 'error' : ''
                    }`}
                  />
                </div>
                {expiryErrorMessage && (
                  <p className="error-text">{expiryErrorMessage}</p>
                )}
              </div>

              {/* CVC Field */}
              <div>
                <label
                  htmlFor="modalCvc"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 h-5 flex items-center truncate"
                  title="Código de seguridad (CVC / CVV)"
                >
                  CVC / CVV *
                </label>
                <div className="relative">
                  <input
                    id="modalCvc"
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    maxLength={4}
                    className={`input-field text-center font-mono ${errors.cvc ? 'error' : ''}`}
                    {...register('cvc', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      },
                    })}
                  />
                </div>
                {errors.cvc && <p className="error-text">{errors.cvc.message}</p>}
              </div>
            </div>

            {/* Installments Selector */}
            <div>
              <label
                htmlFor="modalInstallments"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
              >
                Número de cuotas
              </label>
              <select
                id="modalInstallments"
                className="input-field"
                {...register('installments', { valueAsNumber: true })}
              >
                {[1, 2, 3, 6, 12, 18, 24, 36].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? '1 cuota' : `${n} cuotas`}
                  </option>
                ))}
              </select>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  {...register('termsAccepted')}
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Acepto los{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    términos y condiciones
                  </a>{' '}
                  para realizar mi compra.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="error-text">{errors.termsAccepted.message}</p>
              )}
            </div>
          </div>

          {/* Modal Actions Footer (Pinned at bottom, never cut off on mobile) */}
          <div className="p-3.5 sm:p-5 border-t border-gray-100 bg-gray-50/70 shrink-0 flex gap-2.5 sm:gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="w-1/3 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-2/3 btn-primary py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Creando tu orden...</span>
                </>
              ) : (
                <span>Continuar al Resumen</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
