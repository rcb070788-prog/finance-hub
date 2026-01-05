
import React, { useState, useEffect } from 'react';
import { UserProfile, AppView } from './types';
import { DASHBOARDS, CATEGORIES } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      lastName: formData.get('lastName'),
      voterId: formData.get('voterId'),
      verifier: formData.get('verifier'),
    };

    try {
      const response = await fetch('/.netlify/functions/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setCurrentView(AppView.VOTER_PORTAL);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Connection failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUser({
      fullName: "Sample Voter",
      voterId: "12345",
      district: "District 2",
      email: "voter@example.com",
      phone: "555-0199",
      contactPreference: 'email'
    });
    setCurrentView(AppView.DASHBOARDS);
  };

  const renderHeader = () => (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(AppView.LANDING)}>
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <i className="fa-solid fa-chart-line text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">FinanceHub</span>
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <button 
              onClick={() => setCurrentView(AppView.DASHBOARDS)}
              className={`text-sm font-medium transition-colors ${currentView === AppView.DASHBOARDS ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Dashboards
            </button>
            <button 
              onClick={() => setCurrentView(AppView.COMMUNITY)}
              className={`text-sm font-medium transition-colors ${currentView === AppView.COMMUNITY ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Community
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-semibold">{user.district}</span>
                <button 
                  onClick={() => setUser(null)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-all shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentView(AppView.VOTER_PORTAL)}
                className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                Voter Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const renderLanding = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
          Transparent Finance for <span className="text-blue-600">Active Citizens</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore where your taxes go, participate in community polls, and make your voice heard with secure, verified voter access.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARDS)}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            Explore Data
          </button>
          <button 
            onClick={() => setCurrentView(AppView.VOTER_PORTAL)}
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-all"
          >
            Voter Registration
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`${cat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl mb-4`}>
              <i className={`fa-solid ${cat.icon}`}></i>
            </div>
            <h3 className="font-bold text-lg text-slate-800">{cat.label}</h3>
            <p className="text-sm text-slate-500 mt-2">Browse the latest {cat.label.toLowerCase()} reports and interactive charts.</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboards = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Financial Dashboards</h2>
          <p className="text-slate-500">Interactive tools for fiscal transparency</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DASHBOARDS.map(dash => (
          <div key={dash.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:border-blue-200 transition-all flex flex-col">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
               <img src={`https://picsum.photos/seed/${dash.id}/600/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={dash.title} />
               <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                    {dash.category}
                  </span>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-800 mb-3">{dash.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1">{dash.description}</p>
              <a 
                href={dash.folderPath} 
                className="inline-flex items-center justify-center w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Launch App <i className="fa-solid fa-arrow-right ml-2 text-xs"></i>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVoterPortal = () => (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Secure Voter Login</h2>
        <p className="text-center text-slate-500 text-sm mb-8">Access community voting and feedback</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Voter ID</label>
            <input type="text" required placeholder="Found on your Voter Card" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
            <input type="password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all mb-4">
            Sign In
          </button>
          
          <div className="flex items-center justify-between text-xs font-medium">
            <button type="button" onClick={() => setCurrentView(AppView.RESET_PASSWORD)} className="text-blue-600 hover:underline">Forgot Password?</button>
            <span className="text-slate-400">Need help? contact@hub.gov</span>
          </div>
        </form>
      </div>
    </div>
  );

  const renderResetPassword = () => (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Identify Yourself</h2>
        <p className="text-center text-slate-500 text-sm mb-8">We will send a temporary password to your saved contact method.</p>
        
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Last Name</label>
            <input name="lastName" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Voter ID</label>
            <input name="voterId" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Birth Date or Address</label>
            <input name="verifier" type="text" required placeholder="YYYY-MM-DD or 123 Main St" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-all"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Verify and Reset"}
          </button>
          
          <button type="button" onClick={() => setCurrentView(AppView.VOTER_PORTAL)} className="w-full text-slate-500 text-sm font-medium hover:underline">
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900">Community Engagement</h2>
        <p className="text-slate-500">Shape the future of our district</p>
      </div>

      {!user ? (
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-center">
          <i className="fa-solid fa-lock text-amber-600 text-4xl mb-4"></i>
          <h3 className="text-xl font-bold text-amber-900">Verified Voting Only</h3>
          <p className="text-amber-700 max-w-md mx-auto mt-2">To prevent bot spam, you must be logged in as a verified voter to participate.</p>
          <button 
            onClick={() => setCurrentView(AppView.VOTER_PORTAL)}
            className="mt-6 bg-amber-600 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all"
          >
            Login to Participate
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Active Polls</h3>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-1 rounded">LIVE</span>
             </div>
             <div className="space-y-6">
               <div className="border border-slate-100 p-6 rounded-2xl bg-slate-50">
                 <h4 className="font-bold text-slate-800 mb-2">New Public Library Location</h4>
                 <p className="text-xs text-slate-500 mb-4">Where should the new branch be located?</p>
                 <div className="space-y-3">
                   {['Main St Lot', 'Community Center Expansion'].map(opt => (
                     <button key={opt} className="w-full text-left bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all">
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           </div>

           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-xl font-bold text-slate-900 mb-6">Suggestions Box</h3>
             <form className="space-y-4">
                <textarea 
                  placeholder="Share your thoughts..."
                  className="w-full h-32 px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="anon" className="rounded" />
                  <label htmlFor="anon" className="text-xs text-slate-500 font-medium">Post as Anonymous</label>
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all">
                  Submit Suggestion
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {renderHeader()}
      
      {message && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className={`${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} p-4 rounded-xl border flex items-center shadow-sm`}>
            <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-3`}></i>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <main className="flex-grow transition-all duration-300">
        {currentView === AppView.LANDING && renderLanding()}
        {currentView === AppView.DASHBOARDS && renderDashboards()}
        {currentView === AppView.VOTER_PORTAL && renderVoterPortal()}
        {currentView === AppView.COMMUNITY && renderCommunity()}
        {currentView === AppView.RESET_PASSWORD && renderResetPassword()}
      </main>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2024 Concerned Citizens Web Hub. Empowering through data.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
