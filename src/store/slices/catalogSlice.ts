import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category, Brand } from '../../types';
import { productsApi, ProductsQueryFilters } from '../../api/products.api';
import { categoriesApi, brandsApi } from '../../api/categories.api';

interface CatalogState {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: Category[];
  brands: Brand[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: ProductsQueryFilters;
}

const initialState: CatalogState = {
  products: [],
  total: 0,
  page: 1,
  limit: 8,
  totalPages: 1,
  categories: [],
  brands: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 8,
  },
};

// ─── Thunks ─────────────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk(
  'catalog/fetchProducts',
  async (filters: ProductsQueryFilters | undefined, { rejectWithValue }) => {
    try {
      return await productsApi.getAll(filters);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar los productos');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'catalog/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await productsApi.getOne(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Producto no encontrado');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await categoriesApi.getAll();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar las categorías');
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'catalog/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      return await brandsApi.getAll();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar las marcas');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ProductsQueryFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { page: 1, limit: state.limit };
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.filters.limit = action.payload;
      state.filters.page = 1;
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    // Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.products = action.payload;
          state.total = action.payload.length;
          state.page = 1;
          state.totalPages = 1;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.products = action.payload.data;
          state.total = action.payload.total ?? action.payload.data.length;
          state.page = action.payload.page ?? 1;
          state.limit = action.payload.limit ?? state.limit;
          state.totalPages = action.payload.totalPages ?? 1;
        } else {
          state.products = [];
          state.total = 0;
          state.totalPages = 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Single product
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    // Brands
    builder.addCase(fetchBrands.fulfilled, (state, action) => {
      state.brands = action.payload;
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearSelectedProduct,
} = catalogSlice.actions;

export default catalogSlice.reducer;
