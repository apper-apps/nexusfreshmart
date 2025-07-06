import employees from "@/services/mockData/employees.json";
let employeeData = [...employees];
let lastId = Math.max(...employeeData.map(emp => emp.Id), 0);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// RBAC configuration for employee service
let currentUserRole = 'customer';
const financialFields = ['salary', 'bankAccount', 'taxId', 'benefits'];

const validateFinancialAccess = () => {
  return currentUserRole === 'admin' || currentUserRole === 'finance_manager';
};

const filterEmployeeFinancialData = (employee) => {
  if (validateFinancialAccess()) {
    return employee; // Full access for admin/finance_manager
  }
  
  // Remove financial fields for non-authorized users
  const filtered = { ...employee };
  financialFields.forEach(field => {
    if (field === 'salary') {
      filtered[field] = null; // Hide salary completely
    } else {
      delete filtered[field];
    }
  });
  
  return filtered;
};

const employeeService = {
  async setUserRole(role) {
    await delay(100);
    currentUserRole = role;
    return { role };
  },

  async getCurrentUserRole() {
    await delay(100);
    return { role: currentUserRole };
  },

  async getAll(userRole = null) {
    if (userRole) {
      currentUserRole = userRole;
    }
    
    await delay(300);
    
    // Apply financial data filtering based on user role
    const employees = [...employeeData];
    return employees.map(emp => filterEmployeeFinancialData(emp));
  },


async create(newEmployeeData) {
    await delay(400);
    const newEmployee = {
      ...newEmployeeData,
      Id: ++lastId,
      salary: parseFloat(newEmployeeData.salary),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    employeeData.push(newEmployee);
    return { ...newEmployee };
  },

  async update(id, updatedData) {
    await delay(300);
    const index = employeeData.findIndex(emp => emp.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Employee not found');
    }
    
    const updatedEmployee = {
      ...employeeData[index],
      ...updatedData,
      Id: parseInt(id),
async getById(id, userRole = null) {
    if (userRole) {
      currentUserRole = userRole;
    }
    
    await delay(200);
    const employee = employeeData.find(emp => emp.Id === parseInt(id));
    
    if (!employee) {
      return null;
    }
    
    // Apply financial data filtering
    return filterEmployeeFinancialData({ ...employee });
  },
salary: updatedData.salary ? parseFloat(updatedData.salary) : employeeData[index].salary,
      updatedAt: new Date().toISOString()
    };
    
    employeeData[index] = updatedEmployee;
    return { ...updatedEmployee };
  },

async delete(id) {
    await delay(200);
    const index = employeeData.findIndex(emp => emp.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Employee not found');
    }
    
    const deletedEmployee = employeeData.splice(index, 1)[0];
    return { ...deletedEmployee };
  },

  async getByDepartment(department, userRole = null) {
    if (userRole) {
      currentUserRole = userRole;
    }
    
    await delay(250);
    return employeeData
      .filter(emp => emp.department === department)
      .map(emp => filterEmployeeFinancialData({ ...emp }));
  },

  async getActiveEmployees(userRole = null) {
    if (userRole) {
      currentUserRole = userRole;
    }
    
    await delay(250);
    return employeeData
      .filter(emp => emp.status === 'active')
      .map(emp => filterEmployeeFinancialData({ ...emp }));
  }
};

export default employeeService;