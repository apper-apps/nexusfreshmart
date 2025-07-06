import attendance from '@/services/mockData/attendance.json';

let attendanceData = [...attendance];
let lastId = Math.max(...attendanceData.map(att => att.Id), 0);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const attendanceService = {
  async getAll() {
    await delay(300);
    return [...attendanceData];
  },

  async getById(id) {
    await delay(200);
    const record = attendanceData.find(att => att.Id === parseInt(id));
    return record ? { ...record } : null;
  },

  async create(attendanceRecord) {
    await delay(400);
    const newRecord = {
      ...attendanceRecord,
      Id: ++lastId,
      employeeId: parseInt(attendanceRecord.employeeId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    attendanceData.push(newRecord);
    return { ...newRecord };
  },

  async update(id, updatedData) {
    await delay(300);
    const index = attendanceData.findIndex(att => att.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Attendance record not found');
    }
    
    const updatedRecord = {
      ...attendanceData[index],
      ...updatedData,
      Id: parseInt(id),
      employeeId: parseInt(updatedData.employeeId || attendanceData[index].employeeId),
      updatedAt: new Date().toISOString()
    };
    
    attendanceData[index] = updatedRecord;
    return { ...updatedRecord };
  },

  async delete(id) {
    await delay(200);
    const index = attendanceData.findIndex(att => att.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Attendance record not found');
    }
    
    const deletedRecord = attendanceData.splice(index, 1)[0];
    return { ...deletedRecord };
  },

  async getByEmployeeId(employeeId) {
    await delay(250);
    return attendanceData
      .filter(att => att.employeeId === parseInt(employeeId))
      .map(att => ({ ...att }));
  },

  async getByDate(date) {
    await delay(250);
    return attendanceData
      .filter(att => att.date === date)
      .map(att => ({ ...att }));
  },

  async getByEmployeeAndDate(employeeId, date) {
    await delay(250);
    return attendanceData
      .filter(att => att.employeeId === parseInt(employeeId) && att.date === date)
      .map(att => ({ ...att }));
  },

  async getByEmployeeAndDateRange(employeeId, startDate, endDate) {
    await delay(300);
    return attendanceData
      .filter(att => {
        const recordDate = new Date(att.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return att.employeeId === parseInt(employeeId) && 
               recordDate >= start && recordDate <= end;
      })
      .map(att => ({ ...att }));
  },

  async getByDateRange(startDate, endDate) {
    await delay(300);
    return attendanceData
      .filter(att => {
        const recordDate = new Date(att.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return recordDate >= start && recordDate <= end;
      })
      .map(att => ({ ...att }));
  }
};

export default attendanceService;