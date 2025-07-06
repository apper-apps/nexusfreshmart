import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Loading from '@/components/ui/Loading';
import attendanceService from '@/services/api/attendanceService';
import employeeService from '@/services/api/employeeService';

const AttendanceTracking = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [clockedInEmployees, setClockedInEmployees] = useState(new Set());
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      loadAttendanceForDate();
    }
  }, [selectedEmployee, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, attendanceData] = await Promise.all([
        employeeService.getAll(),
        attendanceService.getAll()
      ]);
      setEmployees(employeesData.filter(emp => emp.status === 'active'));
      setAttendanceRecords(attendanceData);
      
      // Find currently clocked in employees
      const clockedIn = new Set();
      attendanceData.forEach(record => {
        if (record.clockIn && !record.clockOut) {
          clockedIn.add(record.employeeId);
        }
      });
      setClockedInEmployees(clockedIn);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async () => {
    try {
      const records = await attendanceService.getByEmployeeAndDate(
        parseInt(selectedEmployee), 
        selectedDate
      );
      setAttendanceRecords(records);
    } catch (err) {
      toast.error('Failed to load attendance records');
    }
  };

  const handleClockIn = async (employeeId) => {
    try {
      const now = new Date();
      const clockInData = {
        employeeId: employeeId,
        date: now.toISOString().split('T')[0],
        clockIn: now.toTimeString().slice(0, 5),
        clockOut: null,
        notes: ''
      };
      
      await attendanceService.create(clockInData);
      setClockedInEmployees(prev => new Set([...prev, employeeId]));
      toast.success('Clocked in successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to clock in');
    }
  };

  const handleClockOut = async (employeeId) => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Find today's clock-in record
      const todaysRecord = attendanceRecords.find(record => 
        record.employeeId === employeeId && 
        record.date === today && 
        record.clockIn && 
        !record.clockOut
      );
      
      if (todaysRecord) {
        await attendanceService.update(todaysRecord.Id, {
          ...todaysRecord,
          clockOut: now.toTimeString().slice(0, 5)
        });
        setClockedInEmployees(prev => {
          const newSet = new Set(prev);
          newSet.delete(employeeId);
          return newSet;
        });
        toast.success('Clocked out successfully');
        loadData();
      } else {
        toast.error('No clock-in record found for today');
      }
    } catch (err) {
      toast.error('Failed to clock out');
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.create({
        employeeId: parseInt(manualEntryData.employeeId),
        date: manualEntryData.date,
        clockIn: manualEntryData.clockIn,
        clockOut: manualEntryData.clockOut || null,
        notes: manualEntryData.notes
      });
      
      toast.success('Manual entry added successfully');
      setShowManualEntry(false);
      setManualEntryData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        clockIn: '',
        clockOut: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      toast.error('Failed to add manual entry');
    }
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    
    const start = new Date(`2000-01-01T${clockIn}`);
    const end = new Date(`2000-01-01T${clockOut}`);
    const diff = end - start;
    return (diff / (1000 * 60 * 60)).toFixed(2);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.Id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  if (loading) return <Loading type="page" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracking</h2>
          <p className="text-gray-600">Track employee attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowManualEntry(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ApperIcon name="Plus" size={20} />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Quick Clock In/Out */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Clock In/Out</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <div key={employee.Id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ApperIcon name="User" size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.department}</div>
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${
                  clockedInEmployees.has(employee.Id) ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="flex gap-2">
                {clockedInEmployees.has(employee.Id) ? (
                  <Button
                    onClick={() => handleClockOut(employee.Id)}
                    variant="danger"
                    size="small"
                    className="flex-1"
                  >
                    <ApperIcon name="Clock" size={16} />
                    Clock Out
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleClockIn(employee.Id)}
                    size="small"
                    className="flex-1"
                  >
                    <ApperIcon name="Clock" size={16} />
                    Clock In
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input-field"
            >
              <option value="">All Employees</option>
              {employees.map(employee => (
                <option key={employee.Id} value={employee.Id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getEmployeeName(record.employeeId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.clockIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.clockOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateHours(record.clockIn, record.clockOut)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.clockOut 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.clockOut ? 'Complete' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Manual Attendance Entry</h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ApperIcon name="X" size={24} />
                </button>
              </div>
              
              <form onSubmit={handleManualEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={manualEntryData.employeeId}
                    onChange={(e) => setManualEntryData({...manualEntryData, employeeId: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.Id} value={employee.Id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="Date"
                  type="date"
                  value={manualEntryData.date}
                  onChange={(e) => setManualEntryData({...manualEntryData, date: e.target.value})}
                  required
                />
                
                <Input
                  label="Clock In Time"
                  type="time"
                  value={manualEntryData.clockIn}
                  onChange={(e) => setManualEntryData({...manualEntryData, clockIn: e.target.value})}
                  required
                />
                
                <Input
                  label="Clock Out Time"
                  type="time"
                  value={manualEntryData.clockOut}
                  onChange={(e) => setManualEntryData({...manualEntryData, clockOut: e.target.value})}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={manualEntryData.notes}
                    onChange={(e) => setManualEntryData({...manualEntryData, notes: e.target.value})}
                    className="input-field"
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualEntry(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;