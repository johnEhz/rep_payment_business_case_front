import apiClient from './apiClient';
import { CheckoutPreview, Order, PaymentResult, PaymentStatusResponse } from '../types';

export interface PreviewPayload {
  items: { productId: string; quantity: number }[];
  deliveryAddress?: string;
  deliveryNeighborhood?: string;
  deliveryCity?: string;
  deliveryDepartment?: string;
  deliveryCountry?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPhoneExtension?: string;
  deliveryAddress: string;
  deliveryNeighborhood?: string;
  deliveryCity?: string;
  deliveryDepartment?: string;
  deliveryCountry?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryNotes?: string;
  termsAccepted?: boolean;
  termsPermalink?: string;
  acceptanceToken?: string;
}

export interface PayOrderPayload {
  orderNumber: string;
  accessToken: string;
  acceptanceToken?: string;
  cardToken: string;
  installments?: number;
  idempotencyKey?: string;
}

export const ordersApi = {
  preview: (payload: PreviewPayload) =>
    apiClient.post<CheckoutPreview>('/checkout/preview', payload).then((r) => r.data),

  create: (payload: CreateOrderPayload, idempotencyKey?: string) => {
    const key = idempotencyKey || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return apiClient
      .post<Order>('/checkout/order', payload, {
        headers: { 'Idempotency-Key': key },
      })
      .then((r) => r.data);
  },

  pay: (payload: PayOrderPayload, idempotencyKey?: string) => {
    const { idempotencyKey: payloadKey, ...body } = payload;
    const key = payloadKey || idempotencyKey || `pay_${payload.orderNumber}_${Date.now()}`;
    return apiClient
      .post<PaymentResult>('/checkout/pay', body, {
        headers: { 'Idempotency-Key': key },
      })
      .then((r) => r.data);
  },

  getPaymentStatus: (orderIdOrNumber: string, token?: string) =>
    apiClient
      .get<PaymentStatusResponse>(`/orders/${orderIdOrNumber}/payment-status`, {
        params: token ? { token } : undefined,
      })
      .then((r) => r.data),

  track: (orderNumber: string, token: string) =>
    apiClient.get<Order>(`/orders/track/${orderNumber}`, { params: { token } }).then((r) => r.data),

  getActiveOrder: () =>
    apiClient
      .get<{ hasActiveOrder: boolean; order?: Order; remainingSeconds?: number }>(
        '/checkout/active-order'
      )
      .then((r) => r.data),

  cancelActiveOrder: () =>
    apiClient
      .post<{ success: boolean; message: string }>('/checkout/cancel-active-order')
      .then((r) => r.data),
};
