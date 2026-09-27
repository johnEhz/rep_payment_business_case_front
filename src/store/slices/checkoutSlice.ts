import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CheckoutPreview,
  CustomerInfo,
  CardInfo,
  CheckoutStep,
  MerchantData,
} from '../../types';
import { ordersApi } from '../../api/orders.api';
import { paymentsApi } from '../../api/payments.api';
import {
  saveCheckoutToStorage,
  loadCheckoutFromStorage,
  clearCheckoutFromStorage,
} from '../../utils/session';

export interface StockErrorDetail {
  code?: string;
  productId?: string;
  productName?: string;
  availableStock?: number;
  requestedQuantity?: number;
  message: string;
}

interface CheckoutState {
  step: CheckoutStep;
  customerInfo: CustomerInfo | null;
  cardInfo: CardInfo | null;
  preview: CheckoutPreview | null;
  merchantData: MerchantData | null;
  previewLoading: boolean;
  previewError: string | null;
  stockError: StockErrorDetail | null;
  merchantLoading: boolean;
  merchantError: string | null;
}

// Restore from localStorage on boot
const persisted = loadCheckoutFromStorage();

const initialState: CheckoutState = {
  step: persisted?.step ?? 1,
  customerInfo: persisted?.customerInfo ?? null,
  cardInfo: null, // Never persist card data
  preview: persisted?.preview ?? null,
  merchantData: null,
  previewLoading: false,
  previewError: null,
  stockError: null,
  merchantLoading: false,
  merchantError: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchCheckoutPreview = createAsyncThunk(
  'checkout/fetchPreview',
  async (
    payload: {
      items: { productId: string; quantity: number }[];
      deliveryAddress?: string;
      deliveryNeighborhood?: string;
      deliveryCity?: string;
      deliveryDepartment?: string;
      deliveryCountry?: string;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await ordersApi.preview(payload);
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.message ||
        (typeof data === 'string' ? data : 'Error al validar productos o calcular flete');
      return rejectWithValue({
        message: typeof message === 'string' ? message : JSON.stringify(message),
        code: data?.code,
        productId: data?.productId,
        productName: data?.productName,
        availableStock: data?.availableStock,
        requestedQuantity: data?.requestedQuantity,
      });
    }
  }
);

export const fetchMerchantData = createAsyncThunk(
  'checkout/fetchMerchantData',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentsApi.getMerchantData();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Error al conectar con la pasarela de pagos'
      );
    }
  },
  {
    condition: (_, { getState }: any) => {
      const state = getState();
      if (state.checkout?.merchantLoading || state.checkout?.merchantData) {
        return false;
      }
      return true;
    },
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
      saveCheckoutToStorage({
        step: action.payload,
        customerInfo: state.customerInfo,
        preview: state.preview,
      });
    },

    setCustomerInfo(state, action: PayloadAction<CustomerInfo>) {
      state.customerInfo = action.payload;
      saveCheckoutToStorage({
        step: state.step,
        customerInfo: action.payload,
        preview: state.preview,
      });
    },

    setCardInfo(state, action: PayloadAction<CardInfo>) {
      // Card data is stored only in memory (not persisted)
      state.cardInfo = action.payload;
    },

    clearCardInfo(state) {
      state.cardInfo = null;
    },

    clearPreviewError(state) {
      state.previewError = null;
      state.stockError = null;
    },

    resetCheckout(state) {
      state.step = 1;
      state.customerInfo = null;
      state.cardInfo = null;
      state.preview = null;
      state.merchantData = null;
      state.previewError = null;
      state.stockError = null;
      state.merchantError = null;
      clearCheckoutFromStorage();
    },
  },
  extraReducers: (builder) => {
    // Preview
    builder
      .addCase(fetchCheckoutPreview.pending, (state) => {
        state.previewLoading = true;
        state.previewError = null;
        state.stockError = null;
      })
      .addCase(fetchCheckoutPreview.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.preview = action.payload;
        state.previewError = null;
        state.stockError = null;
        saveCheckoutToStorage({
          step: state.step,
          customerInfo: state.customerInfo,
          preview: action.payload,
        });
      })
      .addCase(fetchCheckoutPreview.rejected, (state, action) => {
        state.previewLoading = false;
        const payload = action.payload as any;
        if (payload && typeof payload === 'object' && payload.message) {
          state.previewError = payload.message;
          if (
            payload.code === 'INSUFFICIENT_STOCK' ||
            payload.productId ||
            payload.availableStock !== undefined
          ) {
            state.stockError = payload;
          }
        } else {
          state.previewError = (payload as string) || 'Error al validar el pedido';
        }
      });

    // Merchant data
    builder
      .addCase(fetchMerchantData.pending, (state) => {
        state.merchantLoading = true;
        state.merchantError = null;
      })
      .addCase(fetchMerchantData.fulfilled, (state, action) => {
        state.merchantLoading = false;
        state.merchantData = action.payload;
      })
      .addCase(fetchMerchantData.rejected, (state, action) => {
        state.merchantLoading = false;
        state.merchantError = action.payload as string;
      });
  },
});

export const {
  setStep,
  setCustomerInfo,
  setCardInfo,
  clearCardInfo,
  clearPreviewError,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
