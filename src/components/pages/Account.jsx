import React, { useState } from 'react';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useRBAC } from '@/App';

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, canAccessFinancialData, hasPermission } = useRBAC();
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+92 300 1234567',
    address: '123 Main Street, Lahore',
    city: 'Lahore',
    postalCode: '54000'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving profile:', formData);
  };

// Filter tabs based on user permissions
  const allTabs = [
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'addresses', label: 'Addresses', icon: 'MapPin' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'financial', label: 'Financial Info', icon: 'DollarSign', requiresFinancialAccess: true }
  ];

  const tabs = allTabs.filter(tab => 
    !tab.requiresFinancialAccess || canAccessFinancialData()
  );
return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ApperIcon name="Shield" size={16} />
          <span>Role: {user.role.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ApperIcon name={tab.icon} size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              icon="User"
            />
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              icon="Mail"
            />
            
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              icon="Phone"
            />
            
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              icon="MapPin"
            />
            
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              icon="Home"
              className="md:col-span-2"
            />
            
            <Input
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              icon="Hash"
            />
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
              <Button variant="primary" size="small" icon="Plus">
                Add Address
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Home</span>
                  <div className="flex space-x-2">
                    <button className="text-primary hover:text-primary-dark">
                      <ApperIcon name="Edit" size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <ApperIcon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">123 Main Street, Lahore, Punjab 54000</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Office</span>
                  <div className="flex space-x-2">
                    <button className="text-primary hover:text-primary-dark">
                      <ApperIcon name="Edit" size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <ApperIcon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">456 Business Center, Karachi, Sindh 75000</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive order updates via email</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow -left-px -top-px transition-transform"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-600">Receive order updates via SMS</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow -left-px -top-px transition-transform"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                  <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow -left-px -top-px transition-transform"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start" icon="Key">
                Change Password
              </Button>
              
              <Button variant="outline" className="w-full justify-start" icon="Download">
                Export Data
              </Button>
              
              <Button variant="danger" className="w-full justify-start" icon="Trash2">
                Delete Account
              </Button>
            </div>
          </div>
</div>
      )}

      {activeTab === 'financial' && canAccessFinancialData() && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <ApperIcon name="Shield" size={14} />
                <span>Authorized Access</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Salary Information</h3>
                  <p className="text-sm text-gray-600 mb-1">Base Salary</p>
                  <p className="text-xl font-semibold text-gray-900">PKR 85,000</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Tax Information</h3>
                  <p className="text-sm text-gray-600 mb-1">Tax ID</p>
                  <p className="text-gray-900">TAX-123456789</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Bank Account</h3>
                  <p className="text-sm text-gray-600 mb-1">Account Number</p>
                  <p className="text-gray-900">****-****-1234</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Benefits</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Health Insurance: Active</p>
                    <p className="text-sm text-gray-600">Provident Fund: 10%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <ApperIcon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Restricted Information</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This financial information is only visible to authorized personnel (Admin/Finance Manager).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;