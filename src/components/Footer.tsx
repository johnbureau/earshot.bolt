import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Earshot</h3>
            <p className="text-sm text-gray-400">Connecting exceptional talent with amazing opportunities since 2022.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-sm hover:text-white transition">Features</Link></li>
              <li><Link to="/pricing" className="text-sm hover:text-white transition">Pricing</Link></li>
              <li><Link to="/security" className="text-sm hover:text-white transition">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm hover:text-white transition">About</Link></li>
              <li><Link to="/careers" className="text-sm hover:text-white transition">Careers</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm hover:text-white transition">Terms</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-white transition">Privacy</Link></li>
              <li><Link to="/cookies" className="text-sm hover:text-white transition">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Earshot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;