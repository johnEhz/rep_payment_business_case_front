import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../../components/ProductCard';
import cartReducer, { addItem } from '../../store/slices/cartSlice';
import catalogReducer from '../../store/slices/catalogSlice';
import checkoutReducer from '../../store/slices/checkoutSlice';
import orderReducer from '../../store/slices/orderSlice';
import { Product } from '../../types';

// Mock localStorage
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

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Zapatillas Running Pro',
  description: 'Zapatillas de alto rendimiento para corredores',
  priceInCents: 18000000, // $180.000
  stock: 5,
  imageUrl: null,
  images: [],
  category: 'Calzado',
  brand: 'SportBrand',
  createdAt: '2026-09-24T00:00:00Z',
};

const outOfStockProduct: Product = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Producto Agotado',
  stock: 0,
};

function renderWithStore(ui: React.ReactElement, initialCartItems: any[] = []) {
  const store = configureStore({
    reducer: {
      catalog: catalogReducer,
      cart: cartReducer,
      checkout: checkoutReducer,
      order: orderReducer,
    },
    preloadedState: {
      cart: { items: initialCartItems, isOpen: false },
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
}

describe('ProductCard', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders product name', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Zapatillas Running Pro')).toBeInTheDocument();
  });

  it('renders product price in COP format', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    // Price should be formatted (some variation of $180.000 or $180,000)
    expect(screen.getByText(/180/)).toBeInTheDocument();
  });

  it('renders available stock', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/5 disp/i)).toBeInTheDocument();
  });

  it('renders brand or category', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    expect(screen.getByText('SportBrand')).toBeInTheDocument();
  });

  it('renders category fallback when brand is absent', () => {
    const noBrandProduct = { ...mockProduct, brand: null };
    renderWithStore(<ProductCard product={noBrandProduct} />);
    expect(screen.getByText('Calzado')).toBeInTheDocument();
  });

  it('shows "Agregar" when stock is available', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    const button = screen.getByRole('button', { name: /agregar/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows "Agotado" when stock is 0', () => {
    renderWithStore(<ProductCard product={outOfStockProduct} />);
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0);
  });

  it('disables button when product is out of stock', () => {
    renderWithStore(<ProductCard product={outOfStockProduct} />);
    const button = screen.getByRole('button', { name: /agotado/i });
    expect(button).toBeDisabled();
  });

  it('shows item count when product already in cart', () => {
    const cartItems = [{ productId: 'prod-1', quantity: 2, product: mockProduct }];
    renderWithStore(<ProductCard product={mockProduct} />, cartItems);
    expect(screen.getByText(/\+ \(2\)/)).toBeInTheDocument();
  });

  it('shows stock count accurately', () => {
    const lowStockProduct: Product = { ...mockProduct, stock: 2 };
    renderWithStore(<ProductCard product={lowStockProduct} />);
    expect(screen.getByText(/2 disponibles/i)).toBeInTheDocument();
  });
});
