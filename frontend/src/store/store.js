import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import addressReducer from './slices/addressSlice';

const loadPreloadedState = () => {
  const preloadedState = {};
  
  const savedUser = localStorage.getItem('dumbake_user');
  if (savedUser) {
    try {
      preloadedState.auth = { user: JSON.parse(savedUser), loading: false, error: null };
    } catch (e) {}
  }
  
  const savedCart = localStorage.getItem('dumbake_cart');
  if (savedCart) {
    try {
      preloadedState.cart = { cartItems: JSON.parse(savedCart), isCartOpen: false };
    } catch (e) {}
  }
  
  const savedAddress = localStorage.getItem('dumbake_active_address');
  if (savedAddress) {
    try {
      preloadedState.address = { addresses: [], activeAddress: JSON.parse(savedAddress), isAddressOpen: false };
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
