
import React from 'react';
import { ViewType, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (view: ViewType) => void;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Build Status Indicator */}
      <div className="bg-emerald-600 text-white text-[10px] py-1 px-4 font-mono text-center">
        NETLIFY BUILD STATUS: SUCCESSFUL | VITE @ LATEST | REACT 19 COMPATIBLE
      </div>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg cursor-pointer" onClick={() => setView('dashboard')}>
                <i className="fas fa-landmark text-white text-xl"></i>
              </div>
              <div className="cursor-pointer" onClick={() => setView('dashboard')}>
                <span className="text-xl font-bold text-slate-800 block leading-none">Citizens of MC</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Public Finance Portal</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setView('dashboard')}
                className={`text-sm font-medium ${activeView === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-blue-600'} py-5 transition-colors`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setView('funds')}
                className={`text-sm font-medium ${activeView === 'funds' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-blue-600'} py-5 transition-colors`}
              >
                Fund Explorer
              </button>
              <button 
                onClick={() => setView('ai-analysis')}
                className={`text-sm font-medium ${activeView === 'ai-analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-blue-600'} py-5 transition-colors`}
              >
                AI Insights
              </button>
              {user ? (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setView('voter-portal')}
                    className="text-sm font-medium bg-slate-100 px-4 py-2 rounded-full text-slate-700 hover:bg-slate-200"
                  >
                    Hi, {user.fullName}
                  </button>
                  <button onClick={onLogout} className="text-slate-400 hover:text-red-500">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('voter-login')}
                  className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                  Voter Login
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
               <button className="text-slate-500 p-2">
                 <i className="fas fa-bars text-xl"></i>
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-slate-50">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-800 pb-8">
            <div>
              <h3 className="text-white font-bold mb-4">About the Portal</h3>
              <p className="text-sm leading-relaxed">
                Concerned Citizens of MC is a community-driven initiative dedicated to fiscal transparency and civic engagement in Montgomery County.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Annual Budget Reports</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Vendor Transparency List</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Tax Allocation Data</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <p className="text-sm">Email: transparency@citizensmc.org</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-white"><i className="fab fa-twitter"></i></a>
                <a href="#" className="hover:text-white"><i className="fab fa-facebook"></i></a>
                <a href="#" className="hover:text-white"><i className="fab fa-github"></i></a>
              </div>
            </div>
          </div>
          <p className="text-center text-xs">
            © 2024 Concerned Citizens of Montgomery County. Phase 1 - Public Finance Site.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
