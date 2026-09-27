import checkoutReducer, {
  setStep,
  setCustomerInfo,
  resetCheckout,
} from '../../store/slices/checkoutSlice';
import { CustomerInfo, CheckoutStep } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockCustomerInfo: CustomerInfo = {
  name: 'Ana Torres',
  email: 'ana@example.com',
  phone: '3001234567',
  address: 'Calle 80 #45-20',
  city: 'Medellín',
  notes: '',
};

const initialState = {
  step: 1 as CheckoutStep,
  customerInfo: null,
  cardInfo: null,
  preview: null,
  merchantData: null,
  previewLoading: false,
  previewError: null,
  merchantLoading: false,
  merchantError: null,
};

describe('checkoutSlice', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('setStep', () => {
    it('updates the step', () => {
      const state = checkoutReducer(initialState, setStep(2));
      expect(state.step).toBe(2);
    });

    it('allows all valid steps', () => {
      const steps: CheckoutStep[] = [1, 2, 3, 4, 5];
      steps.forEach((step) => {
        const state = checkoutReducer(initialState, setStep(step));
        expect(state.step).toBe(step);
      });
    });
  });

  describe('setCustomerInfo', () => {
    it('stores customer info', () => {
      const state = checkoutReducer(initialState, setCustomerInfo(mockCustomerInfo));
      expect(state.customerInfo).toEqual(mockCustomerInfo);
    });

    it('persists to localStorage', () => {
      checkoutReducer(initialState, setCustomerInfo(mockCustomerInfo));
      const stored = localStorage.getItem('ecom_checkout');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.customerInfo.email).toBe('ana@example.com');
    });
  });

  describe('resetCheckout', () => {
    it('clears all checkout state', () => {
      let state = checkoutReducer(initialState, setStep(3));
      state = checkoutReducer(state, setCustomerInfo(mockCustomerInfo));
      state = checkoutReducer(state, resetCheckout());

      expect(state.step).toBe(1);
      expect(state.customerInfo).toBeNull();
      expect(state.cardInfo).toBeNull();
      expect(state.preview).toBeNull();
    });

    it('clears localStorage on reset', () => {
      checkoutReducer(initialState, setCustomerInfo(mockCustomerInfo));
      checkoutReducer(initialState, resetCheckout());
      expect(localStorage.getItem('ecom_checkout')).toBeNull();
    });
  });
});
