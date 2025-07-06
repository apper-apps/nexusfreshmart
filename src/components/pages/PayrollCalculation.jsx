import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Loading from '@/components/ui/Loading';
import payrollService from '@/services/api/payrollService';
import attendanceService from '@/services/api/attendanceService';
import employeeService from '@/services/api/employeeService';

const PayrollCalculation = () => {
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [calculationData, setCalculationData] = useState({
    hoursWorked: 0,
    overtimeHours: 0,
    baseSalary: 0,
    overtimePay: 0,
    deductions: 0,
    bonus: 0,
    netSalary: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, payrollData] = await Promise.all([
        employeeService.getAll(),
        payrollService.getByMonth(selectedMonth)
      ]);
      setEmployees(employeesData.filter(emp => emp.status === 'active'));
      setPayrollRecords(payrollData);
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculateEmployeePayroll = async (employee) => {
    try {
      const monthStart = new Date(selectedMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      // Get attendance records for the month
      const attendanceRecords = await attendanceService.getByEmployeeAndDateRange(
        employee.Id, 
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      );

      // Calculate total hours
      let totalHours = 0;
      let totalDays = 0;
      
      attendanceRecords.forEach(record => {
        if (record.clockIn && record.clockOut) {
          const start = new Date(`2000-01-01T${record.clockIn}`);
          const end = new Date(`2000-01-01T${record.clockOut}`);
          const hours = (end - start) / (1000 * 60 * 60);
          totalHours += hours;
          totalDays += 1;
        }
      });

      // Calculate payroll components
      const standardHours = 8; // 8 hours per day
      const expectedHours = totalDays * standardHours;
      const overtimeHours = Math.max(0, totalHours - expectedHours);
      const regularHours = totalHours - overtimeHours;
      
      const hourlyRate = employee.salary / (30 * 8); // Assuming 30 days, 8 hours per day
      const overtimeRate = hourlyRate * 1.5;
      
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const grossSalary = regularPay + overtimePay;
      
      // Calculate deductions (simplified)
      const taxRate = 0.15; // 15% tax
      const socialSecurityRate = 0.062; // 6.2% social security
      const medicareRate = 0.0145; // 1.45% medicare
      
      const tax = grossSalary * taxRate;
      const socialSecurity = grossSalary * socialSecurityRate;
      const medicare = grossSalary * medicareRate;
      const totalDeductions = tax + socialSecurity + medicare;
      
      const netSalary = grossSalary - totalDeductions;

      return {
        employeeId: employee.Id,
        month: selectedMonth,
        hoursWorked: totalHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        baseSalary: employee.salary,
        regularPay: regularPay.toFixed(2),
        overtimePay: overtimePay.toFixed(2),
        grossSalary: grossSalary.toFixed(2),
        tax: tax.toFixed(2),
        socialSecurity: socialSecurity.toFixed(2),
        medicare: medicare.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        bonus: 0,
        netSalary: netSalary.toFixed(2),
        status: 'calculated'
      };
    } catch (err) {
      toast.error(`Failed to calculate payroll for ${employee.name}`);
      return null;
    }
  };

  const handleProcessPayroll = async () => {
    if (!window.confirm('Are you sure you want to process payroll for all employees this month?')) {
      return;
    }

    try {
      setProcessingPayroll(true);
      const calculations = [];

      for (const employee of employees) {
        const calculation = await calculateEmployeePayroll(employee);
        if (calculation) {
          calculations.push(calculation);
        }
      }

      // Save all calculations
      for (const calculation of calculations) {
        await payrollService.create(calculation);
      }

      toast.success(`Payroll processed for ${calculations.length} employees`);
      loadData();
    } catch (err) {
      toast.error('Failed to process payroll');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const handleViewCalculation = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.Id === employeeId);
      if (!employee) return;

      const calculation = await calculateEmployeePayroll(employee);
      if (calculation) {
        setSelectedEmployee(employee);
        setCalculationData(calculation);
        setShowCalculationModal(true);
      }
    } catch (err) {
      toast.error('Failed to calculate payroll');
    }
  };

  const handleApprovePayroll = async (payrollId) => {
    try {
      const record = payrollRecords.find(r => r.Id === payrollId);
      if (record) {
        await payrollService.update(payrollId, {
          ...record,
          status: 'approved'
        });
        toast.success('Payroll approved');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to approve payroll');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.Id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const getTotalPayroll = () => {
    return payrollRecords.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
  };

  if (loading) return <Loading type="page" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Calculation</h2>
          <p className="text-gray-600">Calculate and process employee payroll</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleProcessPayroll}
            disabled={processingPayroll}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Calculator" size={20} />
            {processingPayroll ? 'Processing...' : 'Process Payroll'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Users" size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed Payrolls</p>
              <p className="text-2xl font-bold text-gray-900">{payrollRecords.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="CheckCircle" size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                ${getTotalPayroll().toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="DollarSign" size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="text-sm text-gray-600">
            Processing payroll for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Payroll Records */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold mb-4">Payroll Records</h3>
        
        {payrollRecords.length === 0 ? (
          <div className="text-center py-12">
            <ApperIcon name="Calculator" size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No payroll records found for this month</p>
            <Button onClick={handleProcessPayroll} disabled={processingPayroll}>
              Process Payroll for This Month
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRecords.map((record) => (
                  <tr key={record.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getEmployeeName(record.employeeId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hoursWorked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(record.grossSalary).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(record.totalDeductions).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(record.netSalary).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'calculated'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCalculation(record.employeeId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ApperIcon name="Eye" size={16} />
                        </button>
                        {record.status === 'calculated' && (
                          <button
                            onClick={() => handleApprovePayroll(record.Id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <ApperIcon name="CheckCircle" size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculation Modal */}
      {showCalculationModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Payroll Calculation - {selectedEmployee.name}
                </h3>
                <button
                  onClick={() => setShowCalculationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ApperIcon name="X" size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Hours Worked</p>
                    <p className="text-xl font-bold">{calculationData.hoursWorked}h</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Overtime Hours</p>
                    <p className="text-xl font-bold">{calculationData.overtimeHours}h</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Regular Pay</p>
                    <p className="text-xl font-bold">${parseFloat(calculationData.regularPay).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Overtime Pay</p>
                    <p className="text-xl font-bold">${parseFloat(calculationData.overtimePay).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Gross Salary</p>
                    <p className="text-xl font-bold">${parseFloat(calculationData.grossSalary).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Deductions</p>
                    <p className="text-xl font-bold">${parseFloat(calculationData.totalDeductions).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-primary font-medium">Net Salary</p>
                  <p className="text-2xl font-bold text-primary">${parseFloat(calculationData.netSalary).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCalculationModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollCalculation;