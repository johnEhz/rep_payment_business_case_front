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
  defaultCardHolder?: string;
}

// Normaliza el nombre del titular a formato título (Title Case)
const normalizeName = (name?: string): string => {
  if (!name || !name.trim()) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  merchantPermalink,
  defaultCardHolder = '',
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
      cardHolder: defaultCardHolder ? normalizeName(defaultCardHolder) : '',
      expMonth: '',
      expYear: '',
      cvc: '',
      installments: 1,
      termsAccepted: false,
    },
  });

  const [expiryDisplay, setExpiryDisplay] = useState('');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [focusedField, setFocusedField] = useState<'number' | 'holder' | 'expiry' | 'cvc' | null>(null);

  // Explicitly register month and year fields since they are updated via unified input
  useEffect(() => {
    register('expMonth');
    register('expYear');
  }, [register]);

  const cardNumber = watch('cardNumber') || '';
  const cardHolder = watch('cardHolder') || '';
  const brand: CardBrand = detectCardBrand(cardNumber);
  const cleanDigits = cardNumber.replace(/\D/g, '');
  const last4 = cleanDigits.slice(-4);

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

  // Reset form and pre-fill cardHolder when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (defaultCardHolder && !watch('cardHolder')) {
        setValue('cardHolder', normalizeName(defaultCardHolder), { shouldValidate: true });
      }
    } else {
      reset();
      setExpiryDisplay('');
      setShowInfoTooltip(false);
    }
  }, [isOpen, defaultCardHolder, reset, setValue, watch]);

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 hidden sm:block"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog Content - Full screen on mobile, elegant dialog on desktop */}
      <div className="relative bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-lg w-full z-10 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
        {/* Header - Clean with discreet floating tooltip */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 relative">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Tarjeta de crédito
              </h2>

              {/* Discreet floating tooltip */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setShowInfoTooltip((prev) => !prev)}
                  onMouseEnter={() => setShowInfoTooltip(true)}
                  onMouseLeave={() => setShowInfoTooltip(false)}
                  className="w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                  title="Tus datos viajan protegidos con cifrado bancario SSL"
                  aria-label="Información de seguridad"
                >
                  ?
                </button>

                {showInfoTooltip && (
                  <div
                    role="tooltip"
                    className="absolute left-0 top-full mt-2 z-50 w-56 sm:w-64 p-2.5 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl pointer-events-none animate-in fade-in duration-150"
                  >
                    <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 rotate-45" />
                    <span>Tus datos son procesados directamente con cifrado bancario de 256 bits. No almacenamos tu código de seguridad.</span>
                  </div>
                )}
              </div>
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
        </div>

        {/* Modal Form with Scrollable Content and Fixed Bottom Actions */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable form body */}
          <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
            {/* Visual Ultra-Clean Apple Wallet Styled Card Preview */}
            <div
              className={`relative h-36 xs:h-40 sm:h-46 rounded-2xl sm:rounded-[28px] text-white p-3.5 sm:p-5 shadow-xl flex flex-col justify-between overflow-hidden border transition-all duration-500 shrink-0 ${
                brand === 'mastercard'
                  ? 'bg-gradient-to-br from-indigo-700 via-purple-800 to-rose-900 border-purple-400/30 shadow-purple-900/30'
                  : brand === 'visa'
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 border-indigo-400/30 shadow-indigo-900/30'
                  : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-950 border-indigo-400/25 shadow-indigo-950/25'
              }`}
            >
              {/* Glossy sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-white/[0.12] pointer-events-none rounded-[24px] sm:rounded-[28px]" />

              {/* Dynamic subtle ambient glow */}
              <div
                className={`absolute -right-6 -top-6 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
                  brand === 'mastercard'
                    ? 'bg-rose-400/25 opacity-100'
                    : brand === 'visa'
                    ? 'bg-indigo-300/30 opacity-100'
                    : 'bg-indigo-400/20 opacity-70'
                }`}
              />

              {/* Top row: 'Wallet' label + Cardholder Name on left, '+' minimal button on right */}
              <div className="flex items-start justify-between z-10">
                <div
                  className={`transition-all duration-200 ${
                    focusedField === 'holder' ? 'scale-[1.02] transform' : ''
                  }`}
                >
                  <span className="text-[11px] sm:text-xs font-semibold text-white/60 tracking-wider block">
                    Wallet
                  </span>
                  <p className="text-base sm:text-lg font-medium text-white/95 tracking-tight truncate max-w-[240px] sm:max-w-[300px] mt-0.5">
                    {normalizeName(cardHolder || defaultCardHolder) || 'Titular de la tarjeta'}
                  </p>
                </div>

                {/* Minimalist Plus action button from reference */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-all shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Bottom row: Formatted number on left, Brand Logo + Last4 on right */}
              <div className="flex items-end justify-between z-10 pt-2">
                <div
                  className={`space-y-1 transition-all duration-200 ${
                    focusedField === 'number' || focusedField === 'expiry' ? 'scale-[1.02] transform' : ''
                  }`}
                >
                  {/* Card Number display */}
                  <p className="font-mono text-base sm:text-xl font-bold tracking-[0.14em] sm:tracking-[0.18em] text-white drop-shadow-sm select-none">
                    {displayCardNumber()}
                  </p>

                  {/* Clean Account Info matching reference */}
                  <p className="text-[11px] sm:text-xs text-white/50 font-mono">
                    Account ** {last4 || '5087'}
                  </p>
                </div>

                {/* Right: Dynamic Brand Logo & Masked Digits (Exactly like photo) */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <div key={brand} className="animate-brand-pop flex items-center">
                    {brand === 'mastercard' && (
                      <div className="flex items-center -space-x-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EB001B] shadow-xs" />
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F79E1B] opacity-90 shadow-xs" />
                      </div>
                    )}

                    {brand === 'visa' && (
                      <div className="flex items-center px-1">
                        <span className="text-lg sm:text-xl font-black italic tracking-widest text-white drop-shadow-md">
                          VISA
                        </span>
                      </div>
                    )}

                    {brand === 'unknown' && (
                      <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-white/40">••</span>
                      </div>
                    )}
                  </div>

                  <span className="font-mono text-[10px] sm:text-xs text-white/50 tracking-wider">
                    **** {last4 || '3264'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Number with Live Brand Detection Logo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="modalCardNumber"
                  className="block text-xs font-medium text-gray-700"
                >
                  Número de tarjeta *
                </label>

                {/* Supported brands indicators */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      brand === 'visa'
                        ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    VISA
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      brand === 'mastercard'
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
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
                  onFocus={() => setFocusedField('number')}
                  onBlur={() => setFocusedField(null)}
                />

                {/* Dynamic Brand Logo inside the input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {brand === 'visa' && (
                    <span className="font-extrabold italic text-indigo-600 text-sm animate-brand-pop">
                      VISA
                    </span>
                  )}
                  {brand === 'mastercard' && (
                    <div className="flex items-center -space-x-1.5 animate-brand-pop">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
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
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Nombre del titular *
              </label>
              <input
                id="modalCardHolder"
                type="text"
                autoComplete="cc-name"
                placeholder="Nombre como aparece en la tarjeta"
                minLength={5}
                className={`input-field capitalize placeholder:normal-case font-medium ${errors.cardHolder ? 'error' : ''}`}
                {...register('cardHolder')}
                onFocus={() => setFocusedField('holder')}
                onBlur={() => setFocusedField(null)}
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
                  className="block text-xs font-medium text-gray-700 mb-1.5 h-5 flex items-center truncate"
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
                    onFocus={() => setFocusedField('expiry')}
                    onBlur={() => setFocusedField(null)}
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
                  className="block text-xs font-medium text-gray-700 mb-1.5 h-5 flex items-center truncate"
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
                    onFocus={() => setFocusedField('cvc')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                {errors.cvc && <p className="error-text">{errors.cvc.message}</p>}
              </div>
            </div>

            {/* Installments Selector */}
            <div>
              <label
                htmlFor="modalInstallments"
                className="block text-xs font-medium text-gray-700 mb-1"
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

            {/* Terms and Conditions Checkbox - Compact & Clean */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  {...register('termsAccepted')}
                />
                <span>
                  Acepto los{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 underline font-medium hover:text-primary-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    términos y condiciones
                  </a>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="error-text">{errors.termsAccepted.message}</p>
              )}
            </div>
          </div>

          {/* Modal Actions Footer - Compact & Uncluttered */}
          <div className="p-3.5 sm:p-4 pb-6 sm:pb-4 border-t border-gray-100 bg-gray-50/70 shrink-0 flex gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-2/3 btn-primary py-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
