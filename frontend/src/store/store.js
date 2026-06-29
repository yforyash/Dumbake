import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import addressReducer from './slices/addressSlice';

const loadPreloadedState = () => {
  const preloadedState = {};
  
  const savedUser = localStorage.getItem('dumbake_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && typeof parsed === 'object') {
        preloadedState.auth = { user: parsed, loading: false, error: null };
      }
    } catch (e) {}
  }
  
  const savedCart = localStorage.getItem('dumbake_cart');
  if (savedCart) {
    try {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) {
        preloadedState.cart = { cartItems: parsed, isCartOpen: false };
      }
    } catch (e) {}
  }
  
  const savedAddress = localStorage.getItem('dumbake_active_address');
  if (savedAddress) {
    try {
      const parsed = JSON.parse(savedAddress);
      if (parsed && typeof parsed === 'object') {
        preloadedState.address = { addresses: [], activeAddress: parsed, isAddressOpen: false };
      }
    } catch (e) {}
  }
  
  return preloadedState;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    address: addressReducer
  },
  preloadedState: loadPreloadedState()
});

store.subscribe(() => {
  const state = store.getState();
  if (state.cart.cartItems) {
    localStorage.setItem('dumbake_cart', JSON.stringify(state.cart.cartItems));
  }
  if (state.auth.user) {
    localStorage.setItem('dumbake_user', JSON.stringify(state.auth.user));
  } else {
    localStorage.removeItem('dumbake_user');
  }
  if (state.address.activeAddress) {
    localStorage.setItem('dumbake_active_address', JSON.stringify(state.address.activeAddress));
  } else {
    localStorage.removeItem('dumbake_active_address');
  }
});

export default store;
