import posData from '../mockData/posTransactions.json';

class POSService {
  constructor() {
    this.transactions = [...posData];
  }

  async getAll() {
    await this.delay();
    return [...this.transactions];
  }

  async getById(id) {
    await this.delay();
    const transaction = this.transactions.find(t => t.id === id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return { ...transaction };
  }

  async createTransaction(transactionData) {
    await this.delay();
    const newTransaction = {
      id: this.getNextId(),
      ...transactionData,
      timestamp: new Date().toISOString()
    };
    this.transactions.push(newTransaction);
    return { ...newTransaction };
  }

  async getDailySales(date) {
    await this.delay();
    const targetDate = new Date(date).toDateString();
    const dailyTransactions = this.transactions.filter(
      t => new Date(t.timestamp).toDateString() === targetDate
    );
    
    return {
      transactions: dailyTransactions,
      totalSales: dailyTransactions.reduce((sum, t) => sum + t.total, 0),
      totalTransactions: dailyTransactions.length
    };
  }

  getNextId() {
    const maxId = this.transactions.reduce((max, transaction) => 
      transaction.id > max ? transaction.id : max, 0);
    return maxId + 1;
  }

  delay() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const posService = new POSService();