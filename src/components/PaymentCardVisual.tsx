import React from 'react';
import { CardBrand, detectCardBrand } from '../utils/validators';

export interface PaymentCardVisualProps {
  cardNumber?: string;
  cardHolder?: string;
  expMonth?: string;
  expYear?: string;
  expiryDisplay?: string;
  brand?: CardBrand;
  installments?: number;
  focusedField?: 'number' | 'holder' | 'expiry' | 'cvc' | null;
  className?: string;
  maxWidthClass?: string;
}

export const PaymentCardVisual: React.FC<PaymentCardVisualProps> = ({
  cardNumber = '',
  cardHolder = '',
  expMonth = '',
  expYear = '',
  expiryDisplay = '',
  brand: explicitBrand,
  installments,
  focusedField = null,
  className = '',
  maxWidthClass = 'max-w-[340px] xs:max-w-[370px]',
}) => {
  // If brand is not explicitly passed, detect it from cardNumber
  const brand: CardBrand = explicitBrand || (cardNumber ? detectCardBrand(cardNumber) : 'unknown');

  // Format card number with visual PCI masking (first 4 and last 4 visible, middle 8 masked)
  const displayCardNumber = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) return '••••  ••••  ••••  ••••';

    // Group 1: Digits 1-4 (visible as typed, padded with •)
    const g1 = digits.slice(0, 4).padEnd(4, '•');

    // Group 2 & 3: Middle 8 digits (always masked visually with ••••)
    const g2 = '••••';
    const g3 = '••••';

    // Group 4: Digits 13-16 (visible once reached, otherwise ••••)
    const g4 = digits.length > 12 ? digits.slice(12, 16).padEnd(4, '•') : '••••';

    return `${g1}  ${g2}  ${g3}  ${g4}`;
  };

  // Compute expiry display string
  const formattedExpiry =
    expiryDisplay || (expMonth && expYear ? `${expMonth.padStart(2, '0')}/${expYear.slice(-2)}` : 'MM/AA');

  return (
    <div className={`w-full flex justify-center ${className}`}>
      {/* Physical ISO/IEC 7810 ID-1 standard credit card proportions (1.586 : 1) */}
      <div
        className={`relative w-full ${maxWidthClass} aspect-[1.586/1] rounded-2xl text-white p-4 xs:p-5 shadow-2xl flex flex-col justify-between overflow-hidden border border-white/[0.08] transition-all duration-500 shrink-0 ${
          brand === 'mastercard'
            ? 'bg-gradient-to-br from-[#1d2027] via-[#171a21] to-[#12141a] shadow-black/40'
            : brand === 'visa'
            ? 'bg-gradient-to-br from-[#1a1f2b] via-[#141824] to-[#0f121a] shadow-black/40'
            : 'bg-gradient-to-br from-[#1d2027] via-[#171a21] to-[#12141a] shadow-black/40'
        }`}
      >
        {/* Subtle curved wireframe background lines from reference design */}
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

        {/* Top row: Brand Logo + Metallic EMV Chip on left, installments badge or 3 dots on right */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            {/* Dynamic Brand Logo */}
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

          {/* Right: Installments badge or reference 3-dots */}
          {installments !== undefined ? (
            <span className="font-semibold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] border border-white/10 tracking-wide font-sans">
              {installments === 1 ? '1 cuota' : `${installments} cuotas`}
            </span>
          ) : (
            <div className="flex flex-col gap-1 items-center justify-center p-1 opacity-40">
              <span className="w-1 h-1 rounded-full bg-white" />
              <span className="w-1 h-1 rounded-full bg-white" />
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
          )}
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

        {/* Bottom row: CARD HOLDER and EXPIRES */}
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
              {formattedExpiry}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
