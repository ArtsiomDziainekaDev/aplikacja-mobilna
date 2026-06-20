import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, CartState } from '../../types';

// Funkcja do uzyskania klucza localStorage dla bieżącego użytkownika
const getCurrentUserStorageKey = () => {
  const userId = localStorage.getItem('userId');
  return userId ? `cart_${userId}` : 'cart_guest';
};

// Ładowanie stanu początkowego z localStorage
const loadInitialState = (): CartState => {
  try {
    const serializedState = localStorage.getItem(getCurrentUserStorageKey());
    if (serializedState === null) {
      return {
        items: [],
        total: 0,
        loading: false,
        error: null,
      };
    }
    const parsedState = JSON.parse(serializedState);
    return {
      ...parsedState,
      loading: false,
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      total: 0,
      loading: false,
      error: null,
    };
  }
};

// Zapisywanie stanu do localStorage
const saveCartToStorage = (state: CartState) => {
  try {
    const serializedState = JSON.stringify({
      items: state.items,
      total: state.total,
    });
    localStorage.setItem(getCurrentUserStorageKey(), serializedState);
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
};

// Czyszczenie koszyka gościa
const clearGuestCart = () => {
  localStorage.removeItem('cart_guest');
};

const initialState: CartState = loadInitialState();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => item.currencyId === action.payload.currencyId
      );

      if (existingItem) {
        existingItem.amount += action.payload.amount;
        existingItem.total = existingItem.amount * existingItem.rate;
      } else {
        state.items.push(action.payload);
      }

      state.total = state.items.reduce((sum, item) => sum + item.total, 0);
      saveCartToStorage(state);
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.currencyId !== action.payload);
      state.total = state.items.reduce((sum, item) => sum + item.total, 0);
      saveCartToStorage(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      saveCartToStorage(state);
    },
    updateCartItemAmount: (state, action: PayloadAction<{ currencyId: number; amount: number }>) => {
      const item = state.items.find(item => item.currencyId === action.payload.currencyId);
      if (item) {
        item.amount = action.payload.amount;
        item.total = item.amount * item.rate;
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
        saveCartToStorage(state);
      }
    },
    loadCart: (state) => {
      const newState = loadInitialState();
      state.items = newState.items;
      state.total = newState.total;
    },
    // Nowy reducer do obsługi logowania użytkownika
    handleUserLogin: (state) => {
      // Czyszczenie koszyka gościa przy logowaniu
      clearGuestCart();
      // Ładowanie koszyka użytkownika
      const newState = loadInitialState();
      state.items = newState.items;
      state.total = newState.total;
    }
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  clearCart, 
  updateCartItemAmount, 
  loadCart,
  handleUserLogin 
} = cartSlice.actions;
export default cartSlice.reducer; 