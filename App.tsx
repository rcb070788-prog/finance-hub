
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, DASHBOARDS } from './constants.ts';
import { DashboardConfig } from './types.ts';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeDashboard, setActiveDashboard] = useState<DashboardConfig | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [polls, setPolls] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;
    
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setCurrentPage('home');
      }
    });

    fetchPolls();
    fetchSuggestions();

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase!.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  const fetchPolls = async () => {
    const { data } = await supabase!.from('polls').select('*, poll_options(*)').order('created_at', { ascending: false });
    setPolls(data || []);
  };

  const fetchSuggestions = async () => {
    const { data } = await supabase!.from('suggestions').select('*, profiles(full_name, district)').order('created_at', { ascending: false });
    setSuggestions(data || []);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const adminRequest = async (action: string, payload: any) => {
    const { data: { session } } = await supabase!.auth.getSession();
    const res = await fetch('/.netlify/functions/admin-actions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
    return data;
  };

  const handleCreatePoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const options = (formData.get('options') as string).split(',').map(s => s.trim());
    try {
      await adminRequest('CREATE_POLL', {
        pollData: {
          title: formData.get('title'),
          description: formData.get('description'),
          closed_at: formData.get('closedAt'),
          is_anonymous_voting: formData.get('isAnon') === 'on'
        },
        options
      });
      showToast("Poll Created!");
      fetchPolls();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) return setCurrentPage('login');
    if (profile?.is_banned) return showToast("Account restricted.", "error");
    const { error } = await supabase!.from('poll_votes').upsert({ poll_id: pollId, option_id: optionId, user_id: user.id });
    if (error) showToast("You already voted or poll closed.", "error");
    else showToast("Vote recorded!", "success");
  };

  const handleSuggestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setCurrentPage('login');
    if (profile?.is_banned) return showToast("Account restricted.", "error");
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase!.from('suggestions').insert({ 
      content: formData.get('content'), 
      is_public: formData.get('isPublic') === 'on', 
      user_id: user.id 
    });
    if (error) showToast("Failed to submit.", "error");
    else {
      showToast("Suggestion submitted!");
      fetchSuggestions();
      (e.target as HTMLFormElement).reset();
    }
  };

  if (activeDashboard) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans overflow-hidden">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[110]">
          <button onClick={() => setActiveDashboard(null)} className="bg-white/95 backdrop-blur-md shadow-xl border border-gray-100 text-gray-800 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <i className="fa-solid fa-xmark"></i> Close Report
          </button>
        </div>
        <iframe src={activeDashboard.folderPath} className="w-full h-full border-0" title={activeDashboard.title} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden relative">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      <nav className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-50 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-8">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
            <i className="fa-solid fa-landmark text-indigo-600 text-2xl mr-3"></i>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Finance Hub</span>
          </div>
          <div className="hidden md:flex gap-6">
            <button onClick={() => setCurrentPage('polls')} className={`text-[10px] font-black uppercase tracking-widest ${currentPage === 'polls' ? 'text-indigo-600' : 'text-gray-400'}`}>Polls</button>
            <button onClick={() => setCurrentPage('suggestions')} className={`text-[10px] font-black uppercase tracking-widest ${currentPage === 'suggestions' ? 'text-indigo-600' : 'text-gray-400'}`}>Suggestions</button>
            {profile?.is_admin && <button onClick={() => setCurrentPage('admin')} className="text-[10px] font-black uppercase tracking-widest text-red-500">Admin</button>}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-indigo-600">{profile?.full_name}</span>
              <button onClick={() => supabase!.auth.signOut()} className="text-[10px] font-black uppercase text-red-500">Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage('login')} className="text-gray-600 px-4 py-2 font-black text-[10px] uppercase">Sign In</button>
              <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-md">Register</button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow overflow-y-auto custom-scrollbar container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="max-w-4xl mx-auto space-y-12 text-center">
             <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4">Moore County Transparency</h1>
             <p className="text-gray-500 text-xl">Verified voter records & budget oversight.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
               {CATEGORIES.map(cat => (
                 <div key={cat.id} onClick={() => { setSelectedCategory(cat.id); setCurrentPage('dashboards'); }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer flex items-center gap-6">
                   <div className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg`}><i className={`fa-solid ${cat.icon}`}></i></div>
                   <div className="text-left"><h3 className="text-xl font-black text-gray-800 uppercase">{cat.label}</h3><p className="text-gray-400 text-sm">View records.</p></div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {currentPage === 'polls' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Community Polls</h2>
            {polls.length === 0 && <p className="text-gray-400 font-bold text-center py-10">No active polls.</p>}
            {polls.map(poll => (
              <div key={poll.id} className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
                <h3 className="text-xl font-black mb-2 uppercase">{poll.title}</h3>
                <p className="text-gray-500 mb-6">{poll.description}</p>
                <div className="space-y-3">
                  {poll.poll_options.map((opt: any) => (
                    <button key={opt.id} onClick={() => handleVote(poll.id, opt.id)} className="w-full text-left p-4 rounded-xl border-2 border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all font-bold text-gray-700 flex justify-between">
                      {opt.text} <i className="fa-solid fa-chevron-right text-indigo-200"></i>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentPage === 'suggestions' && (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-indigo-50">
              <h2 className="text-xl font-black uppercase text-indigo-600 mb-6">Submit Idea</h2>
              <form onSubmit={handleSuggestion} className="space-y-4">
                <textarea name="content" required placeholder="Your suggestion..." className="w-full h-32 bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2"><input type="checkbox" name="isPublic" defaultChecked /> <span className="text-[10px] font-black uppercase text-gray-400">Public</span></label>
                  <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px]">Submit</button>
                </div>
              </form>
            </div>
            <div className="space-y-6">
              {suggestions.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-800 font-bold mb-4 italic">"{s.content}"</p>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                    <span>{s.profiles?.full_name} • District {s.profiles?.district}</span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'admin' && profile?.is_admin && (
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl font-black uppercase text-red-600">Admin Control</h2>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-red-50">
              <h3 className="text-xl font-black mb-6 uppercase">Launch New Poll</h3>
              <form onSubmit={handleCreatePoll} className="space-y-4">
                <input name="title" required placeholder="Poll Question" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
                <textarea name="description" placeholder="Additional Details" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
                <input name="options" required placeholder="Options (comma separated: Yes, No, Maybe)" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="datetime-local" name="closedAt" required className="p-4 bg-gray-50 rounded-xl font-bold" />
                  <label className="flex items-center gap-2 px-4"><input type="checkbox" name="isAnon" /> <span className="text-[10px] font-black uppercase">Anonymous Voting</span></label>
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase">Publish Poll</button>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'dashboards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DASHBOARDS.filter(d => d.category === selectedCategory).map(dash => (
              <div key={dash.id} onClick={() => setActiveDashboard(dash)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl cursor-pointer">
                <h4 className="text-xl font-black text-gray-800 uppercase mb-2">{dash.title}</h4>
                <p className="text-gray-400 text-xs mb-4">{dash.description}</p>
                <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Open Report</span>
              </div>
            ))}
          </div>
        )}

        {currentPage === 'signup' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl">
             <h2 className="text-2xl font-black text-center mb-8 uppercase">Voter Registration</h2>
             <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setIsVerifying(true);
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await fetch('/.netlify/functions/verify-voter', {
                    method: 'POST',
                    body: JSON.stringify({ lastName: (fd.get('lastName') as string).toUpperCase(), voterId: fd.get('voterId'), dob: fd.get('dob'), address: fd.get('address') })
                  });
                  const d = await res.json();
                  if (!res.ok) throw new Error(d.error);
                  
                  const { error } = await supabase!.auth.signUp({
                    email: fd.get('email') as string,
                    password: fd.get('password') as string,
                    options: { data: { full_name: d.fullName, district: d.district, voter_id: fd.get('voterId'), phone_number: fd.get('phone') } }
                  });
                  if (error) throw error;
                  showToast("Verification success! Check email.");
                } catch(err: any) { showToast(err.message, 'error'); }
                finally { setIsVerifying(false); }
             }}>
               <input name="lastName" required placeholder="LAST NAME" className="w-full p-4 bg-gray-50 rounded-xl font-bold uppercase" />
               <input name="voterId" required placeholder="VOTER ID" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
               <input type="date" name="dob" required className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
               <input name="address" required placeholder="STREET ADDRESS" className="w-full p-4 bg-gray-50 rounded-xl font-bold uppercase" />
               <input name="email" type="email" required placeholder="EMAIL" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
               <input name="phone" required placeholder="CELL PHONE" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
               <input name="password" type="password" required placeholder="PASSWORD" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
               <button disabled={isVerifying} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase">{isVerifying ? 'VERIFYING...' : 'REGISTER'}</button>
             </form>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl">
            <h2 className="text-2xl font-black text-center mb-8 uppercase">Sign In</h2>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { error } = await supabase!.auth.signInWithPassword({ email: fd.get('email') as string, password: fd.get('password') as string });
              if (error) showToast(error.message, 'error'); else setCurrentPage('home');
            }}>
              <input name="email" type="email" required placeholder="EMAIL" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
              <input name="password" type="password" required placeholder="PASSWORD" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
              <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase">LOGIN</button>
            </form>
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-4 text-center">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verified Infrastructure • Moore County</p>
      </footer>
    </div>
  );
}
