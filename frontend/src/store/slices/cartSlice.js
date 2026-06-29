import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartItems: [],
    isCartOpen: false
  },
  reducers: {
    setCartItems: (state, action) => {
      state.cartItems = action.payload;
    },
    addToCart: (state, action) => {
      const { item, customizations } = action.payload;
      const cartKey = `${item.id}-${customizations.weight || 'Default'}-${customizations.eggless ? 'eggless' : 'egg'}-${customizations.message || ''}-${customizations.instructions || ''}`;
      
      const existing = state.cartItems.find(c => c.cartKey === cartKey);
      if (existing) {
        existing.quantity += 1;
      } else {
        let finalPrice = parseFloat(item.price);
        if (customizations.weight === '1 Kg') {
          finalPrice += 400.00;
        }
        state.cartItems.push({
          ...item,
          cartKey,
          customizations,
          price: finalPrice,
          quantity: 1
        });
      }
      state.isCartOpen = true;
    },
    updateCartQuantity: (state, action) => {
      const { cartKey, quantity } = action.payload;
      if (quantity <= 0) {
        state.cartItems = state.cartItems.filter(c => c.cartKey !== cartKey);
      } else {
        const item = state.cartItems.find(c => c.cartKey === cartKey);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(c => c.cartKey !== action.payload);
    },
    clearCart: (state) => {
      state.cartItems = [];
    },
    setCartOpen: (state, action) => {
      state.isCartOpen = action.payload;
    }
  }
});

export const {
  setCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  setCartOpen
} = cartSlice.actions;

export default cartSlice.reducer;
