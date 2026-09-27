/**
 * Formats an amount in centavos de COP to a human-readable COP currency string.
 * e.g. 250000 → "$2.500"
 */
export function formatCOP(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

/**
 * Converts centavos to pesos (simple division)
 */
export function centsToPesos(centavos: number): number {
  return centavos / 100;
}

/**
 * Converts pesos to centavos
 */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}
