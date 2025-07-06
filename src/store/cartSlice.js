import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Respect stock limits
        const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
        if (newQuantity > existingItem.quantity) {
          existingItem.quantity = newQuantity;
          existingItem.updatedAt = Date.now();
        }
      } else {
        // Add new item with proper field mapping
        const cartItem = {
          ...product,
          quantity: 1,
          addedAt: Date.now(),
          updatedAt: Date.now(),
          image: product.image || product.imageUrl || '/placeholder-image.jpg',
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          unit: product.unit || 'piece'
        };
        state.items.push(cartItem);
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    updateQuantity: (state, action) => {
const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        state.items = state.items.filter(item => item.id !== productId);
      } else {
        const item = state.items.find(item => item.id === productId);
        if (item) {
          // Validate against stock
          const validQuantity = Math.min(quantity, item.stock);
          item.quantity = validQuantity;
          item.updatedAt = Date.now();
          // Note: isUpdating flag should be managed at component level
          // to avoid async operations in reducers
        }
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
    
    calculateTotals: (state) => {
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setLoading,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  calculateTotals,
  setError
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectIsProductInCart = (productId) => (state) => 
  state.cart.items.some(item => item.id === productId);
export const selectProductQuantityInCart = (productId) => (state) => {
  const item = state.cart.items.find(item => item.id === productId);
  return item ? item.quantity : 0;
};

export default cartSlice.reducer;