import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { StatusPage } from '../../pages/StatusPage/StatusPage';
import cartReducer from '../../store/slices/cartSlice';
import catalogReducer from '../../store/slices/catalogSlice';
import checkoutReducer from '../../store/slices/checkoutSlice';
import orderReducer from '../../store/slices/orderSlice';
import { Order, PaymentResult } from '../../types';

const localStorageMock = (() => {
  let store: any = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockOrder: Order = {
  orderNumber: 'JHM-123456',
  status: 'DELIVERED',
  customerName: 'Carlos López',
  customerEmail: 'carlos@test.com',
  customerPhone: '3001234567',
  deliveryAddress: 'Calle 50 #30-20',
  deliveryCity: 'Medellín',
  subtotalAmount: 18000000,
  deliveryFeeAmount: 1200000,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 19200000,
  currency: 'COP',
  expiresAt: '2026-09-24T22:15:00Z',
  paidAt: '2026-09-24T22:05:00Z',
  deliveredAt: '2026-09-24T22:06:00Z',
  createdAt: '2026-09-24T22:00:00Z',
  accessToken: 'token-abc',
  items: [
    {
      productId: 'prod-1',
      productName: 'Zapatillas Running',
      unitPrice: 18000000,
      quantity: 1,
      totalAmount: 18000000,
    },
  ],
  delivery: null,
};

const successPaymentResult: PaymentResult = {
  success: true,
  message: 'Pago aprobado',
  order: mockOrder,
};

const failedPaymentResult: PaymentResult = {
  success: false,
  message: 'Tarjeta rechazada. Fondos insuficientes.',
  order: { ...mockOrder, status: 'PAYMENT_FAILED' },
};

function renderStatusPage(paymentResult: PaymentResult) {
  const store = configureStore({
    reducer: {
      catalog: catalogReducer,
      cart: cartReducer,
      checkout: checkoutReducer,
      order: orderReducer,
    },
    preloadedState: {
      order: {
        currentOrder: paymentResult.order,
        paymentResult,
        creating: false,
        createError: null,
        paying: false,
        payError: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <StatusPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('StatusPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Success state', () => {
    it('shows success heading', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getByText(/pago exitoso/i)).toBeInTheDocument();
    });

    it('shows the order number', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getByText('JHM-123456')).toBeInTheDocument();
    });

    it('shows customer name', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('shows email notification message', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getAllByText(/carlos@test\.com/).length).toBeGreaterThan(0);
    });

    it('shows "Seguir comprando" button', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getByRole('button', { name: /seguir comprando/i })).toBeInTheDocument();
    });

    it('shows DELIVERED status', () => {
      renderStatusPage(successPaymentResult);
      expect(screen.getByText(/entregado/i)).toBeInTheDocument();
    });
  });

  describe('Failed state', () => {
    it('shows failure heading', () => {
      renderStatusPage(failedPaymentResult);
      expect(screen.getByText(/pago rechazado/i)).toBeInTheDocument();
    });

    it('shows the failure reason', () => {
      renderStatusPage(failedPaymentResult);
      expect(screen.getByText(/fondos insuficientes/i)).toBeInTheDocument();
    });

    it('shows "Volver a la tienda" button', () => {
      renderStatusPage(failedPaymentResult);
      expect(screen.getByRole('button', { name: /volver a la tienda/i })).toBeInTheDocument();
    });
  });
});
