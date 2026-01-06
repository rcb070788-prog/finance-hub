
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, DASHBOARDS, TN_VOTER_LOOKUP_URL } from './constants.ts';

// 1. SAFE INITIALIZATION
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const Toast = ({ message, type }: { message: string, type: 'success' | 'error' }) => (
  <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white z-[100] transition-all transform animate-bounce ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
    <i className={`fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
    {message}
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md">
          <i className="fa-solid fa-key text-6xl mb-6 text-yellow-400"></i>
          <h1 className="text-3xl font-black mb-4">Setup Required</h1>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            I can't find your <strong>Supabase URL</strong> or <strong>Anon Key</strong>. 
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Welcome back!", "success");
      setCurrentPage('home');
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsVerifying(true);
    
    const formData = new FormData(e.currentTarget);
    const lastName = (formData.get('lastName') as string).toUpperCase();
    const voterId = formData.get('voterId') as string;
    const dob = formData.get('dob') as string;
    const address = (formData.get('address') as string).toUpperCase();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const verifyRes = await fetch('/.netlify/functions/verify-voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastName, voterId, dob, address })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Identity could not be verified.");
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: verifyData.fullName,
            voter_id: voterId,
            district: verifyData.district
          }
        }
      });

      if (signUpError) throw signUpError;

      showToast("Identity Verified! Please check your email to confirm.", "success");
      setCurrentPage('login');
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("Logged out successfully");
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
          <i className="fa-solid fa-landmark text-indigo-600 text-2xl mr-2"></i>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Community Finance Hub</span>
        </div>
        <div className="flex gap-3 items-center">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-black text-gray-600 uppercase tracking-tighter">Hi, {user.user_metadata?.full_name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-[10px] font-black uppercase text-red-500 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-50 transition">Logout</button>
            </div>
          ) : (
            <>
              <button onClick={() => setCurrentPage('login')} className="text-gray-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition">Login</button>
              <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg">Register</button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 uppercase tracking-tight leading-none">Transparency Portal</h1>
            <p className="text-gray-500 mb-8 text-xl max-w-2xl mx-auto">Access community financial records and participate in public oversight. Only verified voters can view detailed reports.</p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1">
                   Join the Registry
                </button>
                <button onClick={() => setCurrentPage('login')} className="bg-white text-indigo-600 border-2 border-indigo-50 px-8 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-50 transition-all">
                   Voter Login
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all cursor-pointer group text-left relative overflow-hidden">
                   <div className={`${cat.color} opacity-5 absolute -right-4 -top-4 w-32 h-32 rounded-full transform scale-150`}></div>
                  <div className={`${cat.color} w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl relative z-10`}>
                    <i className={`fa-solid ${cat.icon} text-3xl`}></i>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-3 relative z-10 uppercase tracking-tight">{cat.label}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed relative z-10">Detailed reports and real-time ledger data for community oversight.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'signup' && (
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-[2rem]">
              <button onClick={() => setCurrentPage('signup')} className="flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-white shadow-sm text-indigo-600">1. Register</button>
              <button onClick={() => setCurrentPage('login')} className="flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition">2. Login</button>
            </div>

            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100">
              <h2 className="text-3xl font-black text-center mb-2 text-gray-900 uppercase tracking-tighter">New Voter Registry</h2>
              <p className="text-center text-gray-400 mb-10 text-[10px] uppercase font-bold tracking-widest px-4">All entries must match official records exactly</p>
              
              <form className="space-y-6" onSubmit={handleSignup}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Last Name</label>
                    <input name="lastName" required placeholder="E.G. SMITH" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Voter ID #</label>
                    <input name="voterId" required placeholder="12345678" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold" />
                  </div>
                </div>

                <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-900 mb-6 uppercase tracking-widest">Verification Check</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-tighter">Date of Birth</label>
                      <input type="date" name="dob" className="w-full p-4 bg-white rounded-xl border-0 shadow-sm text-sm font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-tighter">Street Address</label>
                      <input name="address" placeholder="123 MAIN ST" className="w-full p-4 bg-white rounded-xl border-0 shadow-sm text-sm font-bold uppercase" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Choose Login Email</label>
                    <input type="email" name="email" required placeholder="name@email.com" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Choose Password</label>
                    <input type="password" name="password" required placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold" />
                  </div>
                </div>
                
                <button disabled={isVerifying} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 disabled:bg-indigo-300 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1">
                  {isVerifying ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-user-shield"></i>}
                  {isVerifying ? 'Verifying Records...' : 'Verify & Register'}
                </button>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-[2rem]">
              <button onClick={() => setCurrentPage('signup')} className="flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition">1. Register</button>
              <button onClick={() => setCurrentPage('login')} className="flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-white shadow-sm text-indigo-600">2. Login</button>
            </div>

            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100">
              <h2 className="text-3xl font-black text-center mb-8 text-gray-900 tracking-tighter uppercase">Voter Login</h2>
              <form className="space-y-4" onSubmit={handleLogin}>
                <input name="email" type="email" placeholder="Email Address" required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold" />
                <input name="password" type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold" />
                <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all transform hover:-translate-y-1">Sign In</button>
              </form>
              <div className="mt-8 text-center pt-6 border-t border-gray-50">
                 <p className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-widest">New to the platform?</p>
                 <button onClick={() => setCurrentPage('signup')} className="w-full border-2 border-indigo-50 text-indigo-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">Start Registration</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 p-12 mt-20 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">© 2024 Community Finance Hub • Verified Identity Platform</p>
      </footer>
    </div>
  );
}
