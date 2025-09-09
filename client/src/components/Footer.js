import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm mb-4 md:mb-0">
            <p>© 2025 Crypto Market Watch. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-6">
            <Link 
              to="/app/contact" 
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </Link>
            <Link 
              to="/app/privacy" 
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/app/terms" 
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
