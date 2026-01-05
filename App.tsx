import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Poll, UserProfile } from './types';
import { DASHBOARDS, CATEGORIES, TN_VOTER_LOOKUP_URL } from './constants';

// UI: User Interface
// CSS: Cascading Style Sheets
// DOM: Document Object Model

const supabaseUrl = (window as any).env?.SUPABASE_URL || '';
const supabaseAnonKey = (window as any).env?.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [step, setStep] = useState<'landing' | 'verify' | 'signup' | 'login' | 'reset' | 'dashboard'>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Form States
  const [verifyData, setVerifyData] = useState({ voterId: '', lastName: '', dob: '', address: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const [resetData, setResetData] = useState({ lastName: '', voterId: '', verifier: '' });
  const [verifiedInfo, setVerifiedInfo] = useState<{ district: string; fullName: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStep('dashboard');
    });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/verify-voter', {
        method: 'POST',
        body: JSON.stringify(verifyData),
      });
      const result = await response.json();
      if (result.success) {
        setVerifiedInfo({ district: result.district, fullName: result.fullName });
        setStep('signup');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: logErr } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (logErr) throw logErr;
      setStep('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/.netlify/functions/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData),
      });
      const result = await response.json();
      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Reset request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('landing')}>
          <i className="fa-solid fa-building-columns text-indigo-600 text-2xl"></i>
          <span className="font-bold text-xl tracking-tight text-slate-800">CommunityFinance</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setStep('login')} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Login</button>
          <button onClick={() => setStep('verify')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">Register</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {step === 'landing' && (
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">Secure Community Voting</h1>
            <p className="text-xl text-slate-600 mb-10">Real transparency starts with verified residents.</p>
            <div className="flex justify-center gap-4">
               <button onClick={() => setStep('verify')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg">Start Voter Verification</button>
            </div>
          </div>
        )}

        {step === 'login' && (
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold mb-6">Voter Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl" required onChange={e => setLoginData({...loginData, email: e.target.value})} />
              <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl" required onChange={e => setLoginData({...loginData, password: e.target.value})} />
              <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Login</button>
              <div className="text-center pt-4">
                <button type="button" onClick={() => setStep('reset')} className="text-sm text-indigo-500 hover:underline">Forgot Password?</button>
              </div>
            </form>
          </div>
        )}

        {step === 'reset' && (
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6">Verify your identity to receive a temporary password.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              {successMsg && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100 mb-4">{successMsg}</div>}
              
              {!successMsg && (
                <>
                  <input type="text" placeholder="Last Name" className="w-full p-3 border rounded-xl" required onChange={e => setResetData({...resetData, lastName: e.target.value})} />
                  <input type="text" placeholder="Voter ID" className="w-full p-3 border rounded-xl" required onChange={e => setResetData({...resetData, voterId: e.target.value})} />
                  <input type="text" placeholder="Verifier (DOB or Street No.)" className="w-full p-3 border rounded-xl" required onChange={e => setResetData({...resetData, verifier: e.target.value})} />
                  <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Request Temp Password'}
                  </button>
                  <div className="text-center">
                    <a href={TN_VOTER_LOOKUP_URL} target="_blank" className="text-xs text-indigo-500 hover:underline">Find my Voter ID</a>
                  </div>
                </>
              )}
              
              <button type="button" onClick={() => setStep('login')} className="w-full text-sm text-slate-400 mt-4">Back to Login</button>
            </form>
          </div>
        )}

        {/* ... Rest of steps (verify, signup, dashboard) would follow same pattern ... */}
      </main>
    </div>
  );
}