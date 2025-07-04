import productsData from '../mockData/products.json';

class ProductService {
  constructor() {
    this.products = [...productsData];
  }

  async getAll() {
    await this.delay();
    return [...this.products];
  }

  async getById(id) {
    await this.delay();
    const product = this.products.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return { ...product };
  }

  async create(productData) {
    await this.delay();
    const newProduct = {
      id: this.getNextId(),
      ...productData
    };
    this.products.push(newProduct);
    return { ...newProduct };
  }

  async update(id, productData) {
    await this.delay();
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    this.products[index] = { ...this.products[index], ...productData };
    return { ...this.products[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    this.products.splice(index, 1);
    return true;
}

  async getByBarcode(barcode) {
    await this.delay();
    const product = this.products.find(p => p.barcode === barcode && p.isActive);
    if (!product) {
      throw new Error('Product not found');
    }
    return { ...product };
  }

  getNextId() {
    const maxId = this.products.reduce((max, product) => 
      product.id > max ? product.id : max, 0);
    return maxId + 1;
  }

  delay() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const productService = new ProductService();