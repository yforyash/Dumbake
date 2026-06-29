import { createSlice } from '@reduxjs/toolkit';

const addressSlice = createSlice({
  name: 'address',
  initialState: {
    addresses: [],
    activeAddress: null,
    isAddressOpen: false
  },
  reducers: {
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    setActiveAddress: (state, action) => {
      state.activeAddress = action.payload;
    },
    setAddressOpen: (state, action) => {
      state.isAddressOpen = action.payload;
    },
    addAddressState: (state, action) => {
      state.addresses.unshift(action.payload);
      state.activeAddress = action.payload;
    },
    deleteAddressState: (state, action) => {
      const id = action.payload;
      state.addresses = state.addresses.filter(a => a.id !== id);
      if (state.activeAddress && state.activeAddress.id === id) {
        state.activeAddress = state.addresses[0] || null;
      }
    }
  }
});

export const {
  setAddresses,
  setActiveAddress,
  setAddressOpen,
  addAddressState,
  deleteAddressState
} = addressSlice.actions;

export default addressSlice.reducer;
