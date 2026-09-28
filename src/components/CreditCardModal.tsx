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
      setShowInfoTooltip(false);
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

  // Format card number display with visual PCI masking (first 4 and last 4 visible, middle 8 masked)
  const displayCardNumber = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) return '••••  ••••  ••••  ••••';

    // Group 1: Digits 1-4 (visible as typed, padded with •)
    const g1 = digits.slice(0, 4).padEnd(4, '•');

    // Group 2 & 3: Middle 8 digits (always masked visually)
    const g2 = '••••';
    const g3 = '••••';

    // Group 4: Digits 13-16 (visible as typed once reached, otherwise ••••)
    const g4 = digits.length > 12 ? digits.slice(12, 16).padEnd(4, '•') : '••••';

    return `${g1}  ${g2}  ${g3}  ${g4}`;
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
            {/* Visual Credit Card matching physical ISO/IEC 7810 ID-1 proportions (1.586 : 1) */}
            <div className="w-full flex justify-center py-1">
              <div
                className={`relative w-full max-w-[340px] xs:max-w-[370px] aspect-[1.586/1] rounded-2xl text-white p-4 xs:p-5 shadow-2xl flex flex-col justify-between overflow-hidden border border-white/[0.08] transition-all duration-500 shrink-0 ${
                  brand === 'mastercard'
                    ? 'bg-gradient-to-br from-[#1d2027] via-[#171a21] to-[#12141a] shadow-black/40'
                    : brand === 'visa'
                    ? 'bg-gradient-to-br from-[#1a1f2b] via-[#141824] to-[#0f121a] shadow-black/40'
                    : 'bg-gradient-to-br from-[#1d2027] via-[#171a21] to-[#12141a] shadow-black/40'
                }`}
              >
                {/* Subtle curved wireframe background lines matching reference */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                  preserveAspectRatio="none"
                  viewBox="0 0 380 240"
                >
                  <path d="M 80 240 Q 240 200 380 110" stroke="white" strokeWidth="0.75" fill="none" />
                  <path d="M 110 240 Q 260 195 380 125" stroke="white" strokeWidth="0.75" fill="none" />
                  <path d="M 140 240 Q 280 190 380 140" stroke="white" strokeWidth="0.75" fill="none" />
                  <path d="M 170 240 Q 300 185 380 155" stroke="white" strokeWidth="0.75" fill="none" />
                  <path d="M 200 240 Q 320 180 380 170" stroke="white" strokeWidth="0.75" fill="none" />
                  <path d="M 230 240 Q 340 175 380 185" stroke="white" strokeWidth="0.75" fill="none" />
                </svg>

                {/* Top row: Brand Logo + Metallic EMV Chip on left, 3 vertical dots on right */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2.5">
                    {/* Brand Logo matching reference */}
                    <div key={brand} className="flex items-center">
                      {brand === 'mastercard' ? (
                        <div className="flex items-center -space-x-2">
                          <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-[#EB001B] shadow-xs" />
                          <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-[#F79E1B] opacity-90 shadow-xs" />
                        </div>
                      ) : brand === 'visa' ? (
                        <span className="text-xl xs:text-2xl font-black italic tracking-wider text-white drop-shadow-sm font-sans">
                          VISA
                        </span>
                      ) : (
                        <div className="flex items-center -space-x-2 opacity-60">
                          <div className="w-6 h-6 rounded-full bg-red-500/70" />
                          <div className="w-6 h-6 rounded-full bg-amber-500/70" />
                        </div>
                      )}
                    </div>

                    {/* Compact Metallic EMV Chip */}
                    <div className="w-7 h-5 xs:w-8 xs:h-6 rounded-[3px] bg-gradient-to-br from-amber-100 via-amber-300 to-yellow-600 p-[1px] shadow-sm border border-amber-200/50 relative overflow-hidden shrink-0">
                      <div className="w-full h-full border border-amber-800/30 rounded-[2px] grid grid-cols-3 grid-rows-2 gap-[1px]">
                        <div className="border-r border-b border-amber-800/30" />
                        <div className="border-b border-amber-800/30" />
                        <div className="border-l border-b border-amber-800/30" />
                        <div className="border-r border-t border-amber-800/30" />
                        <div className="border-t border-amber-800/30" />
                        <div className="border-l border-t border-amber-800/30" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/20 pointer-events-none" />
                    </div>
                  </div>

                  {/* Three vertical dots indicator matching reference */}
                  <div className="flex flex-col gap-1 items-center justify-center p-1 opacity-40">
                    <span className="w-1 h-1 rounded-full bg-white" />
                    <span className="w-1 h-1 rounded-full bg-white" />
                    <span className="w-1 h-1 rounded-full bg-white" />
                  </div>
                </div>

                {/* Middle row: Card Number (PCI masked: first 4 and last 4 visible, middle 8 dots) */}
                <div
                  className={`z-10 py-1 transition-all duration-200 ${
                    focusedField === 'number' ? 'scale-[1.01] transform' : ''
                  }`}
                >
                  <p className="font-mono text-lg xs:text-xl font-medium tracking-[0.16em] xs:tracking-[0.18em] text-white/95 select-none drop-shadow-sm">
                    {displayCardNumber()}
                  </p>
                </div>

                {/* Bottom row: CARD HOLDER and EXPIRES exactly like reference */}
                <div className="flex items-end justify-between z-10 pt-1">
                  <div
                    className={`transition-all duration-200 min-w-0 pr-3 ${
                      focusedField === 'holder' ? 'scale-[1.01] transform' : ''
                    }`}
                  >
                    <span className="text-[9px] xs:text-[10px] uppercase text-white/40 tracking-wider block font-medium">
                      CARD HOLDER
                    </span>
                    <p className="text-xs xs:text-sm font-medium tracking-wider text-white/90 truncate max-w-[170px] xs:max-w-[210px] uppercase font-mono mt-0.5">
                      {cardHolder ? cardHolder.toUpperCase() : 'NOMBRE DEL TITULAR'}
                    </p>
                  </div>

                  <div
                    className={`text-right transition-all duration-200 shrink-0 ${
                      focusedField === 'expiry' ? 'scale-[1.01] transform' : ''
                    }`}
                  >
                    <span className="text-[9px] xs:text-[10px] uppercase text-white/40 tracking-wider block font-medium">
                      EXPIRES
                    </span>
                    <p className="text-xs xs:text-sm font-medium tracking-wider text-white/90 font-mono mt-0.5">
                      {expiryDisplay || 'MM/AA'}
                    </p>
                  </div>
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
                className={`input-field uppercase placeholder:normal-case font-medium ${errors.cardHolder ? 'error' : ''}`}
                {...register('cardHolder', {
                  onChange: (e) => {
                    const upper = (e.target.value || '').toUpperCase();
                    setValue('cardHolder', upper, { shouldValidate: true });
                  },
                })}
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
