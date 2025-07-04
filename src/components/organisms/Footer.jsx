import React from 'react';
import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
                <ApperIcon name="ShoppingBag" size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold">FreshMart</span>
            </Link>
            <p className="text-gray-400">
              Fresh groceries, meat, fruits, and vegetables delivered to your door across Pakistan.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <ApperIcon name="Facebook" size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <ApperIcon name="Instagram" size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <ApperIcon name="Twitter" size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/category/All" className="text-gray-400 hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/category/Groceries" className="text-gray-400 hover:text-white transition-colors">Groceries</Link></li>
              <li><Link to="/category/Meat" className="text-gray-400 hover:text-white transition-colors">Meat</Link></li>
              <li><Link to="/category/Fruits" className="text-gray-400 hover:text-white transition-colors">Fruits</Link></li>
              <li><Link to="/category/Vegetables" className="text-gray-400 hover:text-white transition-colors">Vegetables</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/account" className="text-gray-400 hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white transition-colors">Order History</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Phone" size={16} className="text-gray-400" />
                <span className="text-gray-400">+92 300 1234567</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="Mail" size={16} className="text-gray-400" />
                <span className="text-gray-400">info@freshmart.pk</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="MapPin" size={16} className="text-gray-400" />
                <span className="text-gray-400">Lahore, Punjab, Pakistan</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">We Accept</h4>
              <div className="flex space-x-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded text-sm">
                  JazzCash
                </div>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-3 py-1 rounded text-sm">
                  EasyPaisa
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 FreshMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;