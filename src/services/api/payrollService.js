import payroll from '@/services/mockData/payroll.json';

let payrollData = [...payroll];
let lastId = Math.max(...payrollData.map(pay => pay.Id), 0);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const payrollService = {
  async getAll() {
    await delay(300);
    return [...payrollData];
  },

  async getById(id) {
    await delay(200);
    const record = payrollData.find(pay => pay.Id === parseInt(id));
    return record ? { ...record } : null;
  },

  async create(payrollRecord) {
    await delay(400);
    const newRecord = {
      ...payrollRecord,
      Id: ++lastId,
      employeeId: parseInt(payrollRecord.employeeId),
      baseSalary: parseFloat(payrollRecord.baseSalary),
      regularPay: parseFloat(payrollRecord.regularPay),
      overtimePay: parseFloat(payrollRecord.overtimePay),
      grossSalary: parseFloat(payrollRecord.grossSalary),
      tax: parseFloat(payrollRecord.tax),
      socialSecurity: parseFloat(payrollRecord.socialSecurity),
      medicare: parseFloat(payrollRecord.medicare),
      totalDeductions: parseFloat(payrollRecord.totalDeductions),
      bonus: parseFloat(payrollRecord.bonus || 0),
      netSalary: parseFloat(payrollRecord.netSalary),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    payrollData.push(newRecord);
    return { ...newRecord };
  },

  async update(id, updatedData) {
    await delay(300);
    const index = payrollData.findIndex(pay => pay.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Payroll record not found');
    }
    
    const updatedRecord = {
      ...payrollData[index],
      ...updatedData,
      Id: parseInt(id),
      employeeId: parseInt(updatedData.employeeId || payrollData[index].employeeId),
      updatedAt: new Date().toISOString()
    };
    
    payrollData[index] = updatedRecord;
    return { ...updatedRecord };
  },

  async delete(id) {
    await delay(200);
    const index = payrollData.findIndex(pay => pay.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Payroll record not found');
    }
    
    const deletedRecord = payrollData.splice(index, 1)[0];
    return { ...deletedRecord };
  },

  async getByEmployeeId(employeeId) {
    await delay(250);
    return payrollData
      .filter(pay => pay.employeeId === parseInt(employeeId))
      .map(pay => ({ ...pay }));
  },

  async getByMonth(month) {
    await delay(250);
    return payrollData
      .filter(pay => pay.month === month)
      .map(pay => ({ ...pay }));
  },

  async getByEmployeeAndMonth(employeeId, month) {
    await delay(250);
    return payrollData
      .filter(pay => pay.employeeId === parseInt(employeeId) && pay.month === month)
      .map(pay => ({ ...pay }));
  },

  async getByStatus(status) {
    await delay(250);
    return payrollData
      .filter(pay => pay.status === status)
      .map(pay => ({ ...pay }));
  },

  async getByDateRange(startMonth, endMonth) {
    await delay(300);
    return payrollData
      .filter(pay => pay.month >= startMonth && pay.month <= endMonth)
      .map(pay => ({ ...pay }));
  }
};

export default payrollService;