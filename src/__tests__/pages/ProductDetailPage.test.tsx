import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from '../../pages/ProductDetailPage/ProductDetailPage';
import cartReducer from '../../store/slices/cartSlice';
import catalogReducer from '../../store/slices/catalogSlice';
import checkoutReducer from '../../store/slices/checkoutSlice';
import orderReducer from '../../store/slices/orderSlice';
import { Product } from '../../types';
import { productsApi } from '../../api/products.api';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock productsApi
jest.mock('../../api/products.api', () => ({
  productsApi: {
    getOne: jest.fn(),
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

const mockProductDetail: Product = {
  id: 'prod-uuid-1',
  name: 'Chaqueta Impermeable Pro',
  description: 'Chaqueta de alta montaña con membrana impermeable transpirable.',
  priceInCents: 25000000, // $250.000 COP
  stock: 4,
  imageUrl: 'https://placehold.co/600x600/png',
  images: [
    'https://placehold.co/600x600/png',
    'https://placehold.co/600x600/2.png',
  ],
  category: 'Ropa Outdoor',
  brand: 'MountainBrand',
  createdAt: '2026-09-24T00:00:00Z',
};

function renderProductDetailPage(initialProductId = 'prod-uuid-1') {
  const store = configureStore({
    reducer: {
      catalog: catalogReducer,
      cart: cartReducer,
      checkout: checkoutReducer,
      order: orderReducer,
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/product/${initialProductId}`]}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/" element={<div>Catálogo de Productos</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially while fetching', () => {
    // Return a promise that does not resolve immediately
    (productsApi.getOne as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderProductDetailPage('prod-uuid-1');
    expect(screen.getByText(/cargando detalles del producto/i)).toBeInTheDocument();
  });

  it('renders product information accurately when fetch succeeds', async () => {
    (productsApi.getOne as jest.Mock).mockResolvedValue(mockProductDetail);

    renderProductDetailPage('prod-uuid-1');

    // Wait for title to appear
    expect(
      await screen.findByRole('heading', { name: 'Chaqueta Impermeable Pro' })
    ).toBeInTheDocument();

    // Check category and brand
    expect(screen.getAllByText('Ropa Outdoor').length).toBeGreaterThan(0);
    expect(screen.getByText('MountainBrand')).toBeInTheDocument();

    // Check price
    expect(screen.getAllByText(/250/)[0]).toBeInTheDocument();

    // Check description
    expect(
      screen.getByText(/Chaqueta de alta montaña con membrana impermeable transpirable/i)
    ).toBeInTheDocument();

    // Check available stock
    expect(screen.getByText(/4 unidades disponibles/i)).toBeInTheDocument();
  });

  it('allows incrementing and decrementing quantity within available stock', async () => {
    (productsApi.getOne as jest.Mock).mockResolvedValue(mockProductDetail);

    renderProductDetailPage('prod-uuid-1');

    await screen.findByRole('heading', { name: 'Chaqueta Impermeable Pro' });

    const plusBtn = screen.getByRole('button', { name: /aumentar cantidad/i });
    const minusBtn = screen.getByRole('button', { name: /disminuir cantidad/i });

    // Initial quantity is 1
    expect(screen.getByText('1')).toBeInTheDocument();

    // Click plus -> 2
    fireEvent.click(plusBtn);
    expect(screen.getByText('2')).toBeInTheDocument();

    // Click plus -> 3
    fireEvent.click(plusBtn);
    expect(screen.getByText('3')).toBeInTheDocument();

    // Click plus -> 4 (stock limit)
    fireEvent.click(plusBtn);
    expect(screen.getByText('4')).toBeInTheDocument();

    // Cannot exceed stock (4)
    expect(plusBtn).toBeDisabled();

    // Click minus -> 3
    fireEvent.click(minusBtn);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('dispatches addItem to cart when clicking "Agregar al carrito"', async () => {
    (productsApi.getOne as jest.Mock).mockResolvedValue(mockProductDetail);

    const { store } = renderProductDetailPage('prod-uuid-1');

    await screen.findByRole('heading', { name: 'Chaqueta Impermeable Pro' });

    const addBtn = screen.getByRole('button', { name: /al carrito/i });
    fireEvent.click(addBtn);

    const cartItems = store.getState().cart.items;
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].productId).toBe('prod-uuid-1');
  });

  it('shows not found error when product fetch fails', async () => {
    (productsApi.getOne as jest.Mock).mockRejectedValue(new Error('Producto no encontrado'));

    renderProductDetailPage('non-existent-id');

    expect(await screen.findByRole('heading', { name: 'Producto no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver al catálogo/i })).toBeInTheDocument();
  });
});
