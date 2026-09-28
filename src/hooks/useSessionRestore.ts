import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import {
  loadCheckoutFromStorage,
  loadOrderFromStorage,
  clearOrderFromStorage,
  clearCheckoutFromStorage,
} from '../utils/session';

export function useSessionRestore() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useAppSelector((s) => s.cart.items);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const orderData = loadOrderFromStorage();
    const checkoutData = loadCheckoutFromStorage();

    const isCompleted =
      orderData?.paymentResult?.status === 'APPROVED' ||
      orderData?.paymentResult?.success === true ||
      orderData?.order?.status === 'PAID' ||
      orderData?.order?.status === 'DELIVERED';

    const isExpired =
      Boolean(orderData?.order?.expiresAt && new Date(orderData.order.expiresAt) <= new Date()) ||
      orderData?.order?.status === 'EXPIRED' ||
      orderData?.order?.status === 'CANCELLED';

    if (isCompleted || isExpired) {
      clearOrderFromStorage();
      clearCheckoutFromStorage();
      return;
    }

    if (orderData?.paymentResult?.status === 'PENDING') {
      navigate('/status', { replace: true });
      return;
    }

    if (orderData?.order && checkoutData?.customerInfo && cartItems.length > 0) {
      navigate('/summary', { replace: true });
      return;
    }

    if (checkoutData?.customerInfo && cartItems.length > 0) {
      navigate('/checkout', { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

