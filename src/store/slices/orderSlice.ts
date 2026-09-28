import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Order, PaymentResult } from '../../types';
import { ordersApi, CreateOrderPayload, PayOrderPayload } from '../../api/orders.api';
import {
  saveOrderToStorage,
  loadOrderFromStorage,
  clearOrderFromStorage,
} from '../../utils/session';

interface OrderState {
  currentOrder: Order | null;
  paymentResult: PaymentResult | null;
  creating: boolean;
  createError: string | null;
  paying: boolean;
  payError: string | null;
}

const persisted = loadOrderFromStorage();

const initialState: OrderState = {
  currentOrder: persisted?.order ?? null,
  paymentResult: persisted?.paymentResult ?? null,
  creating: false,
  createError: null,
  paying: false,
  payError: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const createGuestOrder = createAsyncThunk(
  'order/createGuestOrder',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      return await ordersApi.create(payload);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'No se pudo crear la orden';
      if (typeof data?.message === 'string') {
        msg = data.message;
      } else if (typeof data?.message === 'object' && data.message !== null) {
        msg = Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('. ');
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (err.message) {
        msg = err.message;
      }
      return rejectWithValue(msg);
    }
  }
);

export const payOrder = createAsyncThunk(
  'order/payOrder',
  async (payload: PayOrderPayload, { rejectWithValue }) => {
    try {
      return await ordersApi.pay(payload);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Error al procesar el pago';
      if (typeof data?.message === 'string') {
        msg = data.message;
      } else if (typeof data?.message === 'object' && data.message !== null) {
        msg = Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('. ');
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (err.message) {
        msg = err.message;
      }
      return rejectWithValue(msg);
    }
  }
);

export const trackOrder = createAsyncThunk(
  'order/trackOrder',
  async (
    payload: { orderNumber: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      return await ordersApi.track(payload.orderNumber, payload.token);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Orden no encontrada'
      );
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrder(state) {
      state.currentOrder = null;
      state.paymentResult = null;
      state.createError = null;
      state.payError = null;
      clearOrderFromStorage();
    },
    setCurrentOrder(state, action) {
      state.currentOrder = action.payload;
      saveOrderToStorage({ order: action.payload, paymentResult: null });
    },
    clearPayError(state) {
      state.payError = null;
    },
    updatePaymentResult(state, action) {
      if (state.paymentResult) {
        state.paymentResult = { ...state.paymentResult, ...action.payload };
      } else {
        state.paymentResult = action.payload;
      }
      saveOrderToStorage({
        order: state.currentOrder,
        paymentResult: state.paymentResult,
      });
    },
  },
  extraReducers: (builder) => {
    // Create order
    builder
      .addCase(createGuestOrder.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createGuestOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.currentOrder = action.payload;
        saveOrderToStorage({ order: action.payload, paymentResult: null });
      })
      .addCase(createGuestOrder.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
      });

    // Pay order
    builder
      .addCase(payOrder.pending, (state) => {
        state.paying = true;
        state.payError = null;
        if (state.paymentResult) {
          state.paymentResult = {
            ...state.paymentResult,
            status: 'PENDING',
            message: 'Aplicando tu pago... Validando con la pasarela de pagos.',
          };
        }
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        state.paying = false;
        const res = action.payload;
        if (res && typeof res.message !== 'string') {
          res.message =
            typeof res.message === 'object' && res.message !== null
              ? Object.entries(res.message)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                  .join('. ')
              : String(res.message || '');
        }
        state.paymentResult = res;
        if (action.payload?.order) {
          state.currentOrder = action.payload.order;
        }
        saveOrderToStorage({
          order: state.currentOrder,
          paymentResult: res,
        });
      })
      .addCase(payOrder.rejected, (state, action) => {
        state.paying = false;
        state.payError = action.payload as string;
        if (state.paymentResult) {
          state.paymentResult = {
            ...state.paymentResult,
            status: 'DECLINED',
            message: (action.payload as string) || 'No fue posible autorizar la transacción.',
          };
        }
      });

    // Track order
    builder
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        if (state.paymentResult) {
          state.paymentResult.order = action.payload;
          if (action.payload.status === 'PAID' || action.payload.status === 'DELIVERED') {
            state.paymentResult.success = true;
            state.paymentResult.status = 'APPROVED';
          }
        }
        saveOrderToStorage({
          order: action.payload,
          paymentResult: state.paymentResult,
        });
      });
  },
});

export const { clearOrder, setCurrentOrder, clearPayError, updatePaymentResult } = orderSlice.actions;
export default orderSlice.reducer;
