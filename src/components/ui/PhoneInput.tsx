import React, { useState, useRef, useEffect } from 'react';
import { PHONE_PREFIXES } from '../../utils/validators';

interface PhoneInputProps {
  id?: string;
  label?: string;
  phoneExtension: string;
  onExtensionChange: (ext: string) => void;
  phoneNumber: string;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneError?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone',
  label = 'Teléfono / Celular *',
  phoneExtension,
  onExtensionChange,
  phoneNumber,
  onPhoneChange,
  phoneError,
  placeholder = '300 123 4567',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPrefix =
    PHONE_PREFIXES.find((p) => p.number === phoneExtension) || PHONE_PREFIXES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="flex gap-2.5 items-stretch">
        {/* Selector de indicativo (mismo tamaño vertical exacto de h-11 que el resto de inputs) */}
        <div className="relative w-24 flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            className={`w-full h-11 bg-white border rounded-xl px-3 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs transition-all duration-150 cursor-pointer select-none
              ${
                disabled
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : isOpen
                  ? 'border-blue-600 ring-2 ring-blue-100 text-blue-900'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50 text-gray-900'
              }`}
            aria-label="Seleccionar indicativo telefónico"
          >
            {/* Mostrar en el seleccionado SOLO el número */}
            <span className="font-semibold text-gray-900 text-xs sm:text-sm leading-normal">
              {selectedPrefix.number}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menú desplegable con código y número */}
          {isOpen && !disabled && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {PHONE_PREFIXES.map((prefix) => {
                const isSelected = prefix.number === phoneExtension;
                return (
                  <button
                    key={`${prefix.code}-${prefix.number}`}
                    type="button"
                    onClick={() => {
                      onExtensionChange(prefix.number);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer
                      ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    {/* Código y número en la lista */}
                    <span>{prefix.code} {prefix.number}</span>
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Input de número de teléfono con altura exacta de h-11 */}
        <div className="flex-1 min-w-0">
          <input
            id={id}
            type="tel"
            disabled={disabled}
            placeholder={placeholder}
            value={phoneNumber}
            onChange={onPhoneChange}
            className={`w-full h-11 input-field text-xs sm:text-sm ${phoneError ? 'error' : ''}`}
          />
        </div>
      </div>

      {phoneError && <p className="error-text">{phoneError}</p>}
    </div>
  );
};
