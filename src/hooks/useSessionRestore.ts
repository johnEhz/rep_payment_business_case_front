import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { loadCheckoutFromStorage, loadOrderFromStorage } from '../utils/session';

/**
 * Restores the user to the correct step on page refresh.
 * - If there's a completed payment result → /status
 * - If there's a pending order in progress → /summary
 * - If there's customer info filled → /checkout
 * - Otherwise → /
 */
export function useSessionRestore() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useAppSelector((s) => s.cart.items);

  useEffect(() => {
    // Only restore on the root path to avoid overriding deep links
    if (location.pathname !== '/') return;

    const orderData = loadOrderFromStorage();
    const checkoutData = loadCheckoutFromStorage();

    // If there's a payment result, restore to status
    if (orderData?.paymentResult) {
      navigate('/status', { replace: true });
      return;
    }

    // If there's a pending order (created but not paid), restore to summary
    if (orderData?.order && checkoutData?.customerInfo && cartItems.length > 0) {
      navigate('/summary', { replace: true });
      return;
    }

    // If there's customer info and cart items, restore to checkout
    if (checkoutData?.customerInfo && cartItems.length > 0) {
      navigate('/checkout', { replace: true });
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only
}
