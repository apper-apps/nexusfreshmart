import { useEffect, useState } from "react";

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('freshmart_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('freshmart_cart', JSON.stringify(cart));
  }, [cart]);

const addToCart = (product) => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        
        if (existingItem) {
          // If item exists, increase quantity but respect stock limits
          const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
          if (newQuantity === existingItem.quantity) {
            // Stock limit reached
            setIsLoading(false);
            return prevCart;
          }
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: newQuantity, updatedAt: Date.now() }
              : item
          );
        } else {
          // If item doesn't exist, add new item with proper field mapping
          const cartItem = {
            ...product,
            quantity: 1,
            addedAt: Date.now(),
            updatedAt: Date.now(),
            // Ensure image field is properly mapped
            image: product.image || product.imageUrl || '/placeholder-image.jpg',
            // Ensure all required fields are present
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            unit: product.unit || 'piece'
          };
          return [...prevCart, cartItem];
        }
      });
      setIsLoading(false);
    }, 200);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          // Validate against stock
          const validQuantity = Math.min(newQuantity, item.stock);
          return { 
            ...item, 
            quantity: validQuantity, 
            updatedAt: Date.now(),
            isUpdating: true 
          };
        }
        return item;
      })
    );

    // Remove updating flag after animation
    setTimeout(() => {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, isUpdating: false } : item
        )
      );
    }, 300);
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItems = () => {
    return cart;
  };

  const isProductInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  const getProductQuantityInCart = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartItems,
    isProductInCart,
    getProductQuantityInCart,
    isLoading
  };
};