import ordersData from '../mockData/orders.json';

class OrderService {
  constructor() {
    this.orders = [...ordersData];
  }

  async getAll() {
    await this.delay();
    return [...this.orders];
  }

  async getById(id) {
    await this.delay();
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return { ...order };
  }

  async create(orderData) {
    await this.delay();
    const newOrder = {
      id: this.getNextId(),
      ...orderData,
      createdAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
    return { ...newOrder };
  }

  async update(id, orderData) {
    await this.delay();
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }
    this.orders[index] = { ...this.orders[index], ...orderData };
    return { ...this.orders[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }
    this.orders.splice(index, 1);
    return true;
  }

  getNextId() {
    const maxId = this.orders.reduce((max, order) => 
      order.id > max ? order.id : max, 0);
    return maxId + 1;
  }
async assignDeliveryPersonnel(orderId, deliveryPersonId) {
    await this.delay();
    const order = await this.getById(orderId);
    const updatedOrder = {
      ...order,
      deliveryPersonId: deliveryPersonId,
      deliveryStatus: 'assigned'
    };
    return await this.update(orderId, updatedOrder);
  }

  async updateDeliveryStatus(orderId, deliveryStatus, actualDelivery = null) {
    await this.delay();
    const order = await this.getById(orderId);
    const updatedOrder = {
      ...order,
      deliveryStatus,
      ...(actualDelivery && { actualDelivery })
    };
    return await this.update(orderId, updatedOrder);
  }

  async getOrdersByDeliveryPerson(deliveryPersonId) {
    await this.delay();
    return this.orders.filter(order => order.deliveryPersonId === deliveryPersonId);
  }

  async getOrdersByDeliveryStatus(deliveryStatus) {
    await this.delay();
    return this.orders.filter(order => order.deliveryStatus === deliveryStatus);
  }

// Payment Integration Methods
  async updatePaymentStatus(orderId, paymentStatus, paymentResult = null) {
    await this.delay();
    const order = await this.getById(orderId);
    const updatedOrder = {
      ...order,
      paymentStatus,
      paymentResult,
      ...(paymentStatus === 'paid' && { paidAt: new Date().toISOString() })
    };
    return await this.update(orderId, updatedOrder);
  }

  async getOrdersByPaymentStatus(paymentStatus) {
    await this.delay();
    return this.orders.filter(order => order.paymentStatus === paymentStatus);
  }

  async getOrdersByPaymentMethod(paymentMethod) {
    await this.delay();
    return this.orders.filter(order => order.paymentMethod === paymentMethod);
  }

  async processRefund(orderId, refundAmount, reason) {
    await this.delay();
    const order = await this.getById(orderId);
    const refund = {
      id: this.getNextId(),
      orderId,
      amount: refundAmount,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    const updatedOrder = {
      ...order,
      refundRequested: true,
      refund,
      status: 'refund_requested'
    };
    
    return await this.update(orderId, updatedOrder);
  }

  delay() {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}

export const orderService = new OrderService();