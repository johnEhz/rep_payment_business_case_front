import { formatCOP, centsToPesos, pesosToCents } from '../../utils/currency';

describe('currency utils', () => {
  describe('formatCOP', () => {
    it('formats zero correctly', () => {
      const result = formatCOP(0);
      expect(result).toMatch(/\$\s*0/);
    });

    it('formats 250000 centavos as $2.500', () => {
      const result = formatCOP(250000);
      // COP formatting: $ 2.500 (with . as thousands separator)
      expect(result).toMatch(/2[.,]500/);
    });

    it('formats 10000000 centavos as $100.000', () => {
      const result = formatCOP(10000000);
      expect(result).toMatch(/100[.,]000/);
    });

    it('always returns a string', () => {
      expect(typeof formatCOP(12345)).toBe('string');
    });
  });

  describe('centsToPesos', () => {
    it('converts 100 centavos to 1 peso', () => {
      expect(centsToPesos(100)).toBe(1);
    });

    it('converts 250000 centavos to 2500 pesos', () => {
      expect(centsToPesos(250000)).toBe(2500);
    });

    it('returns 0 for 0', () => {
      expect(centsToPesos(0)).toBe(0);
    });
  });

  describe('pesosToCents', () => {
    it('converts 1 peso to 100 centavos', () => {
      expect(pesosToCents(1)).toBe(100);
    });

    it('converts 2500 pesos to 250000 centavos', () => {
      expect(pesosToCents(2500)).toBe(250000);
    });

    it('handles decimal pesos correctly', () => {
      expect(pesosToCents(1.5)).toBe(150);
    });
  });
});
