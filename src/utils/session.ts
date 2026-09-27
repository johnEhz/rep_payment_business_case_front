import { CartItem, CheckoutPreview, CustomerInfo, Order, PaymentResult, CheckoutStep } from '../types';

const CART_KEY = 'ecom_cart';
const CHECKOUT_KEY = 'ecom_checkout';
const ORDER_KEY = 'ecom_order';

// ─── Cart ─────────────────────────────────────────────────────────────────────
export function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function clearCartFromStorage(): void {
  localStorage.removeItem(CART_KEY);
}

// ─── Checkout (customer info, step, preview) ──────────────────────────────────
interface PersistedCheckout {
  step: CheckoutStep;
  customerInfo: CustomerInfo | null;
  preview: CheckoutPreview | null;
}

export function saveCheckoutToStorage(data: PersistedCheckout): void {
  try {
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function loadCheckoutFromStorage(): PersistedCheckout | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCheckout;
  } catch {
    return null;
  }
}

export function clearCheckoutFromStorage(): void {
  localStorage.removeItem(CHECKOUT_KEY);
}

// ─── Order & payment result ────────────────────────────────────────────────────
interface PersistedOrder {
  order: Order | null;
  paymentResult: PaymentResult | null;
}

export function saveOrderToStorage(data: PersistedOrder): void {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function loadOrderFromStorage(): PersistedOrder | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedOrder;
  } catch {
    return null;
  }
}

export function clearOrderFromStorage(): void {
  localStorage.removeItem(ORDER_KEY);
}

/**
 * Wipe all app state from localStorage (used on full reset)
 */
export function clearAllStorage(): void {
  clearCartFromStorage();
  clearCheckoutFromStorage();
  clearOrderFromStorage();
}
