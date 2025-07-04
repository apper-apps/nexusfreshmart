import deliveryPersonnelData from '../mockData/deliveryPersonnel.json';

class DeliveryPersonnelService {
  constructor() {
    this.personnel = [...deliveryPersonnelData];
  }

  async getAll() {
    await this.delay();
    return [...this.personnel];
  }

  async getById(id) {
    await this.delay();
    const person = this.personnel.find(p => p.Id === parseInt(id));
    if (!person) {
      throw new Error('Delivery personnel not found');
    }
    return { ...person };
  }

  async create(personnelData) {
    await this.delay();
    const newPersonnel = {
      Id: this.getNextId(),
      ...personnelData,
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: true,
      totalDeliveries: 0,
      rating: 5.0
    };
    this.personnel.push(newPersonnel);
    return { ...newPersonnel };
  }

  async update(id, personnelData) {
    await this.delay();
    const index = this.personnel.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Delivery personnel not found');
    }
    this.personnel[index] = { ...this.personnel[index], ...personnelData };
    return { ...this.personnel[index] };
  }

  async delete(id) {
    await this.delay();
    const index = this.personnel.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Delivery personnel not found');
    }
    this.personnel.splice(index, 1);
    return true;
  }

  async getAvailablePersonnel() {
    await this.delay();
    return this.personnel.filter(p => p.status === 'available' && p.isActive);
  }

  async getPersonnelByZone(zone) {
    await this.delay();
    return this.personnel.filter(p => p.zone === zone && p.isActive);
  }

  async updateLocation(id, location) {
    await this.delay();
    const index = this.personnel.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Delivery personnel not found');
    }
    this.personnel[index].currentLocation = location;
    return { ...this.personnel[index] };
  }

  async updateStatus(id, status) {
    await this.delay();
    const index = this.personnel.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Delivery personnel not found');
    }
    this.personnel[index].status = status;
    return { ...this.personnel[index] };
  }

  getNextId() {
    const maxId = this.personnel.reduce((max, person) => 
      person.Id > max ? person.Id : max, 0);
    return maxId + 1;
  }

  delay() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const deliveryPersonnelService = new DeliveryPersonnelService();