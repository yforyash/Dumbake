import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    updateWalletBalance: (state, action) => {
      if (state.user) {
        state.user.wallet_balance = action.payload;
      }
    }
  }
});

export const { setUser, clearUser, updateWalletBalance } = authSlice.actions;
export default authSlice.reducer;
