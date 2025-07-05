class CartService {
  constructor() {
    this.cart = [];
  }

  async getCart() {
    await this.delay();
    return [...this.cart];
  }

  async addToCart(product) {
    await this.delay();
    
    if (!product || !product.id) {
      throw new Error('Invalid product data');
    }

    const existingItem = this.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity respecting stock limits
      const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
      if (newQuantity > existingItem.quantity) {
        existingItem.quantity = newQuantity;
        existingItem.updatedAt = Date.now();
        return { ...existingItem };
      } else {
        throw new Error('Stock limit reached');
      }
    } else {
      // Add new item
      const cartItem = {
        ...product,
        quantity: 1,
        addedAt: Date.now(),
        updatedAt: Date.now(),
        image: product.image || product.imageUrl || '/placeholder-image.jpg',
        unit: product.unit || 'piece'
      };
      this.cart.push(cartItem);
      return { ...cartItem };
    }
  }

  async removeFromCart(productId) {
    await this.delay();
    
    const index = this.cart.findIndex(item => item.id === productId);
    if (index === -1) {
      throw new Error('Item not found in cart');
    }
    
    this.cart.splice(index, 1);
    return true;
  }

  async updateQuantity(productId, quantity) {
    await this.delay();
    
    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    const item = this.cart.find(item => item.id === productId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    // Validate against stock
    const validQuantity = Math.min(quantity, item.stock);
    item.quantity = validQuantity;
    item.updatedAt = Date.now();
    
    return { ...item };
  }

  async clearCart() {
    await this.delay();
    this.cart = [];
    return true;
  }

  async getCartTotal() {
    await this.delay();
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  async getCartCount() {
    await this.delay();
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  async syncCart(cartItems) {
    await this.delay();
    this.cart = [...cartItems];
    return [...this.cart];
  }

  delay(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cartService = new CartService();