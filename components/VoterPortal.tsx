
import React, { useState } from 'react';
import { MOCK_VOTERS } from '../mockData';
import { User } from '../types';

interface VoterPortalProps {
  onLogin: (user: User) => void;
  currentUser: User | null;
}

const VoterPortal: React.FC<VoterPortalProps> = ({ onLogin, currentUser }) => {
  const [voterId, setVoterId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function for the "Step-by-Step" testing request
  const fillTestCredentials = () => {
    setVoterId('V12345');
    setPin('1234');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay for realistic "testing"
    setTimeout(() => {
      const voter = MOCK_VOTERS.find(v => v.voterId === voterId && v.pin === pin);
      
      if (voter) {
        onLogin({
          voterId: voter.voterId,
          fullName: voter.fullName,
          district: voter.district,
          isLoggedIn: true
        });
      } else {
        setError('Invalid Voter ID or PIN. Use V12345 / 1234 for testing.');
      }
      setLoading(false);
    }, 800);
  };

  if (currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-600 px-8 py-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Welcome, {currentUser.fullName}</h1>
              <p className="opacity-80 mt-1">Verified Voter Portal • {currentUser.district}</p>
            </div>
            <i className="fas fa-check-circle absolute -right-4 -bottom-4 text-white/10 text-9xl"></i>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                <h3 className="font-bold text-slate-800 mb-2">District Representation</h3>
                <p className="text-sm text-slate-600 mb-4">Your district is currently allocated 12% of the county budget.</p>
                <button className="text-blue-600 text-sm font-bold hover:underline">View Representative Budget Votes &rarr;</button>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                <h3 className="font-bold text-slate-800 mb-2">Upcoming Town Halls</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex justify-between">
                    <span>March 25: Education Levy</span>
                    <span className="font-bold">6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>April 2: Road Safety</span>
                    <span className="font-bold">7:30 PM</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm italic">
                "As a voter in {currentUser.district}, your feedback on these expenditures is vital to our democratic process."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
              <i className="fas fa-id-card text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Voter Portal Login</h2>
            <p className="text-slate-500 text-sm mt-1">Access district-specific financial data.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Voter ID</label>
              <input 
                type="text" 
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="V12345"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">PIN (4-digits)</label>
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={4}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center space-x-2 animate-pulse">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-[0.98] ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <i className="fas fa-circle-notch animate-spin"></i>
                  <span>Authenticating...</span>
                </span>
              ) : 'Access Voter Portal'}
            </button>
          </form>

          {/* Test Helper Section */}
          <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center">
                <i className="fas fa-flask mr-2"></i> Test Mode
              </h4>
              <button 
                onClick={fillTestCredentials}
                className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Auto-fill Credentials
              </button>
            </div>
            <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
              Click the button above to quickly test the successful login state using Jane Citizen's account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterPortal;
