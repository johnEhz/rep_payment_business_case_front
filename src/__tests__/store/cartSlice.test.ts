import cartReducer, {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  selectCartCount,
  selectCartSubtotal,
} from '../../store/slices/cartSlice';
import { Product } from '../../types';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Camiseta Test',
  description: 'Una camiseta de prueba',
  priceInCents: 4900000, // $49.000
  stock: 10,
  imageUrl: null,
  images: [],
  category: 'Ropa',
  brand: 'TestBrand',
  createdAt: '2026-09-24T00:00:00Z',
};

const mockProduct2: Product = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Pantalón Test',
  priceInCents: 8000000, // $80.000
  stock: 5,
};

const initialState = {
  items: [],
  isOpen: false,
};

describe('cartSlice', () => {
  describe('addItem', () => {
    it('adds a new item to empty cart', () => {
      const state = cartReducer(initialState, addItem({ product: mockProduct }));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('prod-1');
      expect(state.items[0].quantity).toBe(1);
    });

    it('increments quantity when adding existing item', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, addItem({ product: mockProduct }));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('respects stock limit when adding', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct, quantity: 10 }));
      state = cartReducer(state, addItem({ product: mockProduct, quantity: 5 }));
      // Stock is 10, so qty should not exceed 10
      expect(state.items[0].quantity).toBe(10);
    });

    it('adds custom quantity', () => {
      const state = cartReducer(initialState, addItem({ product: mockProduct, quantity: 3 }));
      expect(state.items[0].quantity).toBe(3);
    });

    it('can add multiple different products', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, addItem({ product: mockProduct2 }));
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('removes an item from cart', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, removeItem('prod-1'));
      expect(state.items).toHaveLength(0);
    });

    it('only removes the targeted item', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, addItem({ product: mockProduct2 }));
      state = cartReducer(state, removeItem('prod-1'));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('prod-2');
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, updateQuantity({ productId: 'prod-1', quantity: 5 }));
      expect(state.items[0].quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, updateQuantity({ productId: 'prod-1', quantity: 0 }));
      expect(state.items).toHaveLength(0);
    });

    it('caps quantity at stock level', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      // mockProduct.stock = 10, try to set 15
      state = cartReducer(state, updateQuantity({ productId: 'prod-1', quantity: 15 }));
      expect(state.items[0].quantity).toBe(10);
    });
  });

  describe('clearCart', () => {
    it('empties the cart', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct }));
      state = cartReducer(state, addItem({ product: mockProduct2 }));
      state = cartReducer(state, clearCart());
      expect(state.items).toHaveLength(0);
    });
  });

  describe('cart visibility', () => {
    it('openCart sets isOpen to true', () => {
      const state = cartReducer(initialState, openCart());
      expect(state.isOpen).toBe(true);
    });

    it('closeCart sets isOpen to false', () => {
      const openState = { ...initialState, isOpen: true };
      const state = cartReducer(openState, closeCart());
      expect(state.isOpen).toBe(false);
    });

    it('toggleCart flips isOpen', () => {
      let state = cartReducer(initialState, toggleCart());
      expect(state.isOpen).toBe(true);
      state = cartReducer(state, toggleCart());
      expect(state.isOpen).toBe(false);
    });
  });

  describe('selectors', () => {
    it('selectCartCount returns total units', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct, quantity: 2 }));
      state = cartReducer(state, addItem({ product: mockProduct2, quantity: 3 }));
      const count = selectCartCount({ cart: state });
      expect(count).toBe(5);
    });

    it('selectCartSubtotal calculates correct total in cents', () => {
      let state = cartReducer(initialState, addItem({ product: mockProduct, quantity: 2 }));
      const subtotal = selectCartSubtotal({ cart: state });
      // 4900000 * 2 = 9800000 centavos
      expect(subtotal).toBe(9800000);
    });
  });
});
