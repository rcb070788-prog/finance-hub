
import React, { useState, useEffect } from 'react';
import { CATEGORIES, DASHBOARDS, TN_VOTER_LOOKUP_URL } from './constants';
import { DashboardConfig, UserProfile, Poll, Suggestion } from './types';

// Components
const Navbar = ({ user, onLogout, onNavigate }: { user: UserProfile | null, onLogout: () => void, onNavigate: (page: string) => void }) => (
  <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
    <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
      <i className="fa-solid fa-landmark text-indigo-600 text-2xl mr-2"></i>
      <span className="text-xl font-bold text-gray-800">Finance Hub</span>
    </div>
    <div className="flex gap-6 items-center">
      <button onClick={() => onNavigate('home')} className="text-gray-600 hover:text-indigo-600 font-medium">Finance</button>
      {user ? (
        <>
          <button onClick={() => onNavigate('polls')} className="text-gray-600 hover:text-indigo-600 font-medium">Polls</button>
          <button onClick={() => onNavigate('suggestions')} className="text-gray-600 hover:text-indigo-600 font-medium">Suggestions</button>
          <div className="flex items-center gap-3 ml-4 border-l pl-4">
            <span className="text-sm font-semibold text-gray-700">Hi, {user.fullName.split(' ')[0]}</span>
            <button 
              onClick={() => onNavigate('profile')} 
              className="bg-indigo-100 text-indigo-700 p-2 rounded-full hover:bg-indigo-200 transition"
            >
              <i className="fa-solid fa-user"></i>
            </button>
            <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700 underline">Logout</button>
          </div>
        </>
      ) : (
        <button 
          onClick={() => onNavigate('login')} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Voter Login
        </button>
      )}
    </div>
  </nav>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeDashboard, setActiveDashboard] = useState<DashboardConfig | null>(null);

  // Mock initial data
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    setActiveDashboard(null);
    if (page === 'home') setSelectedCategory(null);
  };

  const openDashboard = (dash: DashboardConfig) => {
    setActiveDashboard(dash);
    setCurrentPage('dashboard-view');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} onNavigate={navigateTo} />

      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* HOME PAGE */}
        {currentPage === 'home' && !selectedCategory && (
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Public Finance Transparency</h1>
              <p className="text-lg text-gray-600">Access real-time data on how our community manages public funds. No login required for financial data.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-300 transition-all text-left flex items-center gap-6"
                >
                  <div className={`${cat.color} w-16 h-16 rounded-xl flex items-center justify-center text-white text-3xl group-hover:scale-110 transition`}>
                    <i className={`fa-solid ${cat.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{cat.label}</h3>
                    <p className="text-gray-500">View detailed reports and analysis for {cat.label.toLowerCase()}.</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY EXPLORATION PAGE */}
        {currentPage === 'home' && selectedCategory && (
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="mb-6 text-indigo-600 font-semibold hover:underline flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Main
            </button>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h2>
              <p className="text-gray-600 mb-8">
                {selectedCategory === 'expenses' && "Transparency in spending is critical for accountability. Below are the dashboards available for tracking our expenditures."}
                {selectedCategory === 'revenues' && "Learn where our community's funding comes from, including taxes, grants, and fees."}
                {selectedCategory === 'assets' && "Review the physical and financial holdings owned by our community."}
                {selectedCategory === 'liabilities' && "Monitor our long-term debts and financial obligations to ensure future stability."}
              </p>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Available Dashboards</h4>
                <div className="grid grid-cols-1 gap-4">
                  {DASHBOARDS.filter(d => d.category === selectedCategory).length > 0 ? (
                    DASHBOARDS.filter(d => d.category === selectedCategory).map(dash => (
                      <button
                        key={dash.id}
                        onClick={() => openDashboard(dash)}
                        className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-white transition group"
                      >
                        <div className="text-left">
                          <h5 className="font-bold text-gray-800 group-hover:text-indigo-600">{dash.title}</h5>
                          <p className="text-sm text-gray-500">{dash.description}</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-indigo-500"></i>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500">New dashboards for this category will be available soon.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW (IFRAME) */}
        {currentPage === 'dashboard-view' && activeDashboard && (
          <div className="h-[80vh] flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{activeDashboard.title}</h2>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Close Dashboard
                </button>
             </div>
             <iframe 
                src={activeDashboard.folderPath} 
                className="w-full h-full border-none rounded-xl shadow-lg bg-white"
                title={activeDashboard.title}
             />
          </div>
        )}

        {/* LOGIN PAGE */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-8">Voter Login</h2>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              // Mock Login
              setUser({
                fullName: "Jane Doe",
                voterId: "12345",
                district: "District 4",
                email: "jane@example.com",
                phone: "555-0199",
                contactPreference: 'email'
              });
              setCurrentPage('home');
            }}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input type="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input type="password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                Sign In
              </button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <button onClick={() => setCurrentPage('signup')} className="text-indigo-600 hover:underline">New voter? Create an account</button>
              <br />
              <button onClick={() => setCurrentPage('reset-password')} className="text-gray-500 text-sm hover:underline">Forgot password?</button>
            </div>
          </div>
        )}

        {/* SIGNUP PAGE */}
        {currentPage === 'signup' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-2">Voter Registration</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Verify your voter status to participate in community polls.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name (as on Voter Card)</label>
                <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Voter ID Number</label>
                <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                <p className="mt-2 text-xs text-gray-500">
                  Don't know your Voter ID#? 
                  <a href={TN_VOTER_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-600 underline">Find it here</a>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                Verify & Sign Up
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => setCurrentPage('login')} className="text-indigo-600 hover:underline">Already have an account? Login</button>
            </div>
          </div>
        )}

        {/* RESET PASSWORD PAGE */}
        {currentPage === 'reset-password' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Enter your details to receive a temporary password.</p>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              alert("If details match, a temporary password has been sent to your preferred contact method.");
              setCurrentPage('login');
            }}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Voter ID Number</label>
                <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                Request Temporary Password
              </button>
            </form>
            <div className="mt-6 text-center">
               <a href={TN_VOTER_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline text-sm">TN Voter Lookup</a>
            </div>
          </div>
        )}

        {/* POLLS PAGE */}
        {currentPage === 'polls' && (
          <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Community Polls</h1>
                {user?.isAdmin && (
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">Create New Poll</button>
                )}
             </div>

             <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">Open</span>
                        <h3 className="text-xl font-bold text-gray-800">Proposed Library Renovation</h3>
                      </div>
                      <span className="text-sm text-gray-400">Ends Oct 30, 2024</span>
                   </div>
                   <p className="text-gray-600 mb-6">Should the city allocate $2M from the general fund for the expansion of the Main Street Library?</p>
                   
                   <div className="flex gap-4">
                      <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition">Yes, Support</button>
                      <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 transition">No, Oppose</button>
                   </div>

                   <div className="mt-8 border-t pt-6">
                      <h4 className="font-bold text-gray-800 mb-4">Comments (2)</h4>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                           <div className="flex justify-between mb-2">
                             <span className="font-bold text-sm">John Smith <span className="text-gray-400 font-normal">(District 2)</span></span>
                             <span className="text-xs text-gray-400">2 hours ago</span>
                           </div>
                           <p className="text-sm text-gray-600">The library needs this! Our kids have no place to study after school.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input placeholder="Add a comment..." className="flex-grow p-2 border rounded-lg outline-none focus:ring-1 ring-indigo-500" />
                        <button className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold">Post</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SUGGESTIONS PAGE */}
        {currentPage === 'suggestions' && (
          <div className="max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold text-gray-900 mb-8">Voter Suggestions</h1>
             
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-12">
                <h3 className="text-xl font-bold mb-4">Submit a New Suggestion</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                   <textarea 
                    className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="What can we do better? Your ideas help shape the community."
                   ></textarea>
                   <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="privacy" value="public" defaultChecked />
                        <span className="text-sm font-medium">Public (Everyone can see)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="privacy" value="private" />
                        <span className="text-sm font-medium">Private (Admins only)</span>
                      </label>
                   </div>
                   <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                      Submit Suggestion
                   </button>
                </form>
             </div>

             <div className="space-y-6">
                <h4 className="font-bold text-gray-400 uppercase tracking-widest text-sm">Recent Public Suggestions</h4>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between mb-4">
                      <span className="font-bold">Mary Williams <span className="text-gray-400 font-normal">(District 5)</span></span>
                      <span className="text-xs text-gray-400">Yesterday</span>
                   </div>
                   <p className="text-gray-700">We should consider solar panels for the municipal building. It would save money in the long run!</p>
                </div>
             </div>
          </div>
        )}

        {/* PROFILE PAGE */}
        {currentPage === 'profile' && user && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold mb-8">Voter Profile Settings</h2>
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-500 font-bold uppercase tracking-tighter">Verified Status</p>
                  <p className="font-bold text-indigo-900">Voter ID: {user.voterId}</p>
                  <p className="text-sm text-indigo-700">{user.district}</p>
                </div>
                <i className="fa-solid fa-circle-check text-green-500 text-3xl"></i>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input defaultValue={user.email} className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input defaultValue={user.phone} className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Preference</label>
                  <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 ring-indigo-500">
                    <option value="email">Email Only</option>
                    <option value="text">Text Only</option>
                    <option value="both">Both Email and Text</option>
                  </select>
                </div>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white border-t py-8 px-6 mt-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2024 Community Finance Transparency Hub</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600">Terms of Use</a>
            <a href="#" className="hover:text-indigo-600">Contact Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
