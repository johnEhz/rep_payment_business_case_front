import { z } from 'zod';

export const PHONE_PREFIXES = [
  { code: 'CO', number: '+57' }
] as const;

/** Schema for Delivery & Buyer Form (Step 2 Page) */
export const deliveryInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  phoneExtension: z.string().min(1, 'Selecciona el indicativo'),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(15, 'El teléfono es demasiado largo')
    .regex(/^[\d\s+\-()]+$/, 'Solo se permiten números y caracteres +, -, (, )'),
  country: z.string().min(1, 'Selecciona un país'),
  department: z.string().min(1, 'Selecciona un departamento'),
  city: z.string().min(1, 'Selecciona una ciudad o municipio'),
  address: z
    .string()
    .min(5, 'Ingresa una dirección de entrega válida (ej: Carrera 73B # 75-171)')
    .max(150, 'La dirección es demasiado larga'),
  complement: z
    .string()
    .max(100, 'El complemento es muy largo')
    .optional(),
  neighborhood: z
    .string()
    .min(2, 'Ingresa tu barrio o sector (ej: Robledo)')
    .max(100, 'Nombre de barrio demasiado largo'),
  notes: z.string().max(300, 'Las notas son demasiado largas').optional(),
});

export type DeliveryInfoFormValues = z.infer<typeof deliveryInfoSchema>;

/** Schema for Credit Card Modal */
export const creditCardModalSchema = z.object({
  cardNumber: z
    .string()
    .min(16, 'El número de tarjeta es inválido')
    .max(19, 'El número de tarjeta es inválido')
    .regex(/^[\d\s]+$/, 'Solo se permiten números'),
  cardHolder: z
    .string()
    .trim()
    .min(5, 'El nombre del titular no debe contener menos de 5 caracteres')
    .max(100, 'Nombre demasiado largo'),
  expMonth: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Mes inválido (01–12)'),
  expYear: z
    .string()
    .regex(/^\d{2}$/, 'Año inválido (ej: 27)'),
  cvc: z
    .string()
    .min(3, 'El CVC debe tener 3 o 4 dígitos')
    .max(4, 'El CVC debe tener 3 o 4 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  installments: z.number().min(1).max(36),
  termsAccepted: z.boolean().refine((v) => v === true, 'Debes aceptar los términos y condiciones para continuar'),
});

export type CreditCardModalFormValues = z.infer<typeof creditCardModalSchema>;

/** Complete Step 2 Schema (for backward compatibility) */
export const step2Schema = deliveryInfoSchema.merge(creditCardModalSchema);
export type Step2FormValues = z.infer<typeof step2Schema>;

/** Helper to format standard address + complement */
export function buildFormattedAddress(address: string, complement?: string): string {
  const clean = (address || '').trim();
  if (complement && complement.trim().length > 0) {
    return `${clean}, ${complement.trim()}`;
  }
  return clean;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

/** Detects card brand based on card number prefix */
export function detectCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  return 'unknown';
}
