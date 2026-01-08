
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, DASHBOARDS, OFFICIALS } from './constants.ts';
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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile Layout States
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedOfficials, setSelectedOfficials] = useState<string[]>([]);
  const [isOfficialDropdownOpen, setIsOfficialDropdownOpen] = useState(false);

  const [messages, setMessages] = useState([
    { 
      id: '1', 
      user: 'Jane D.', 
      district: 'Dist 4', 
      to: 'Mayor Sloan Stewart', 
      text: 'What is the timeline for the new courthouse roof repairs?', 
      isAnonymous: false,
      date: 'Oct 24, 2024',
      response: { author: 'Mayor Sloan Stewart', text: 'We have approved the contractor, work begins next Monday.', date: '2 hours ago' }
    },
    { 
      id: '2', 
      user: 'Verified Voter', 
      district: 'Dist 2', 
      to: 'Robert Bracewell', 
      text: 'Thank you for looking into the District 2 drainage issues.', 
      isAnonymous: true,
      date: 'Oct 23, 2024',
      response: null
    }
  ]);
  
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => 
      m.user.toLowerCase().includes(q) || 
      m.to.toLowerCase().includes(q) || 
      m.text.toLowerCase().includes(q) ||
      (m.response?.author.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="max-w-md">
          <i className="fa-solid fa-key text-6xl mb-6 text-yellow-400"></i>
          <h1 className="text-3xl font-black mb-4">Setup Required</h1>
          <p className="text-indigo-200 mb-8 leading-relaxed">Missing Supabase configuration.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        showToast("Access Granted!", "success");
        setCurrentPage('home');
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('home');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsVerifying(true);
    const formData = new FormData(e.currentTarget);
    const lastName = formData.get('lastName') as string;
    const voterId = formData.get('voterId') as string;
    const dob = formData.get('dob') as string;
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const verifyRes = await fetch('/.netlify/functions/verify-voter', {
        method: 'POST',
        body: JSON.stringify({ lastName, voterId, dob, address }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Verification failed");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: verifyData.fullName,
            district: verifyData.district,
            voter_id: voterId
          }
        }
      });

      if (error) throw error;
      showToast("Verification Successful! Check your email for confirmation.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || selectedOfficials.length === 0) {
      showToast("Please select at least one official and type a message.", "error");
      return;
    }
    
    const addressedTo = selectedOfficials.join(', ');
    
    const post = {
      id: Date.now().toString(),
      user: isAnonymous ? 'Verified Voter' : (user.user_metadata?.full_name?.split(' ')[0] + ' ' + (user.user_metadata?.full_name?.split(' ')[1]?.[0] || '') + '.'),
      district: user.user_metadata?.district || 'Member',
      to: addressedTo,
      text: newMessage,
      isAnonymous,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      response: null
    };
    
    setMessages([post, ...messages]);
    setNewMessage('');
    setSelectedOfficials([]);
    showToast("Message Posted! Notification Sent (Simulated).", "success");
  };

  const toggleOfficial = (name: string) => {
    setSelectedOfficials(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const goHome = () => {
    setCurrentPage('home');
    setSelectedCategory(null);
    setActiveDashboard(null);
  };

  if (activeDashboard) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} />}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[110]">
          <button onClick={() => setActiveDashboard(null)} className="bg-white/95 backdrop-blur-md shadow-xl border border-gray-100 text-gray-800 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest group">
            <i className="fa-solid fa-xmark text-xs sm:text-sm group-hover:rotate-90 transition-transform"></i> 
            <span>Close Report</span>
          </button>
        </div>
        <iframe src={activeDashboard.folderPath} className="w-full h-full border-0" title={activeDashboard.title} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden relative">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {/* IMPROVED MOBILE NAV */}
      <nav className="bg-white shadow-sm px-3 md:px-6 py-3 flex justify-between items-center z-50 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2 md:gap-10">
          <div className="flex items-center cursor-pointer" onClick={goHome}>
            <i className="fa-solid fa-landmark text-indigo-600 text-lg md:text-2xl mr-1.5 md:mr-3"></i>
            <span className="text-xs md:text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
               <span className="hidden xs:inline">County </span>Finance Hub
            </span>
          </div>
          <button 
            onClick={() => {
              setCurrentPage('board');
              setSelectedCategory(null);
            }} 
            className={`flex items-center text-xs md:text-xl font-bold tracking-tight transition-all py-1 px-1.5 border-b-4 rounded-t-sm ${currentPage === 'board' ? 'text-gray-900 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-900'}`}
          >
            <i className="fa-solid fa-envelope mr-1 md:mr-3 text-base md:text-lg"></i>
            <span className="hidden sm:inline">Let's Talk</span>
          </button>
        </div>
        <div className="flex gap-1 md:gap-2 items-center">
          {user ? (
            <div className="flex items-center gap-1 md:gap-3">
              <span className="text-[8px] md:text-xs font-black text-gray-600 uppercase tracking-tighter hidden sm:inline">Hi, {user.user_metadata?.full_name?.split(' ')[0]}</span>
              <button onClick={async () => { await supabase.auth.signOut(); showToast("Logged out"); }} className="text-[7px] md:text-[9px] font-black uppercase text-red-500 border border-red-100 px-1.5 py-1 rounded-lg hover:bg-red-50 transition">Logout</button>
            </div>
          ) : (
            <div className="flex gap-1 items-center">
              <button onClick={() => setCurrentPage('login')} className="text-gray-600 px-1.5 md:px-3 py-1 rounded-lg font-black text-[7px] md:text-[10px] uppercase tracking-widest hover:bg-gray-100 transition">Login</button>
              <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 text-white px-2 md:px-3 py-1 rounded-lg font-black text-[7px] md:text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-md">Register</button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow overflow-hidden container mx-auto px-4 flex flex-col pt-4 relative">
        {currentPage === 'home' && !selectedCategory && (
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col pt-2 md:justify-center overflow-y-auto custom-scrollbar scroll-smooth">
            <header className="mb-4 md:mb-8 text-center shrink-0">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-2 md:mb-4">
                <i className="fa-solid fa-globe"></i> Transparency Portal
              </div>
              <h1 className="text-2xl md:text-6xl font-black mb-1 md:mb-3 text-gray-900 uppercase tracking-tighter leading-none">Oops Transparency</h1>
              <p className="text-gray-500 text-[10px] md:text-xl max-w-2xl mx-auto px-4">Finance hub for Metro Lynchburg/Moore County.</p>
            </header>
            
            {/* GRID FIX: Ensures all 4 categories are visible via scrolling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 pb-20">
              {CATEGORIES.map(cat => (
                <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all cursor-pointer group flex items-start gap-4 md:gap-6 hover:-translate-y-1">
                  <div className={`${cat.color} w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center text-white shadow-xl relative z-10 group-hover:rotate-6 transition-transform`}>
                    <i className={`fa-solid ${cat.icon} text-lg md:text-2xl`}></i>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-base md:text-xl font-black text-gray-800 mb-0.5 uppercase tracking-tight truncate">{cat.label}</h3>
                    <p className="text-gray-400 text-[9px] md:text-sm leading-snug">View {cat.label.toLowerCase()} records.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'home' && selectedCategory && (
          <div className="flex flex-col h-full overflow-hidden">
             <div className="flex items-center gap-2 mb-3 shrink-0">
               <button onClick={goHome} className="text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">
                 <i className="fa-solid fa-house"></i> Home
               </button>
               <span className="text-gray-300 text-[9px]">/</span>
               <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest">{selectedCategory}</span>
             </div>
             <div className="flex-grow overflow-y-auto space-y-12 pb-12 pr-1 custom-scrollbar">
                <section>
                  <div className="mb-6">
                    <h2 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">{selectedCategory} Dashboards</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {DASHBOARDS.filter(d => d.category === selectedCategory).map(dash => (
                      <div key={dash.id} onClick={() => setActiveDashboard(dash)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-1 rounded-lg border border-gray-100">{dash.status || 'Official'}</span>
                         </div>
                         <h4 className="text-base md:text-xl font-black text-gray-800 mb-2 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{dash.title}</h4>
                         <p className="text-gray-400 text-[9px] md:text-xs leading-relaxed mb-6 line-clamp-2">{dash.description}</p>
                         <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                           View Data <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                         </span>
                      </div>
                    ))}
                  </div>
                </section>
             </div>
          </div>
        )}

        {currentPage === 'board' && (
          <div className="flex h-full gap-8 overflow-hidden pb-8 relative">
            {/* MOBILE DRAWER: Slides from left */}
            <aside className={`
              fixed md:relative top-0 left-0 h-full w-[85%] md:w-80 z-[60] 
              transform transition-transform duration-300 ease-in-out
              ${isArchiveOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
              bg-white flex flex-col rounded-r-[2rem] md:rounded-[2rem] border-r md:border border-gray-100 shrink-0
            `}>
              <div className="p-6 border-b border-gray-50 bg-indigo-50/30 flex justify-between items-center">
                <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                  <i className="fa-solid fa-box-archive"></i> Message Archive
                </h2>
                <button onClick={() => setIsArchiveOpen(false)} className="md:hidden text-indigo-900 bg-white/50 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <div className="p-4 bg-indigo-50/10 shrink-0">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                  <input 
                    type="text" 
                    placeholder="Search history..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-[10px] font-bold border border-transparent focus:border-indigo-200 outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-3 pb-20">
                {filteredMessages.length > 0 ? filteredMessages.map(msg => (
                  <div key={`archive-${msg.id}`} className="p-3.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-50 group" 
                    onClick={() => {
                      document.getElementById(`msg-${msg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      if (window.innerWidth < 768) setIsArchiveOpen(false);
                    }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black uppercase text-indigo-600 truncate max-w-[100px]">{msg.to}</span>
                      <span className="text-[6px] font-bold text-gray-300 uppercase">{msg.date}</span>
                    </div>
                    <p className="text-[9px] font-medium text-gray-500 line-clamp-1 italic">"{msg.text}"</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[7px] font-black text-gray-800 uppercase tracking-tight">{msg.user}</span>
                      {msg.response && <i className="fa-solid fa-circle-check text-[7px] text-green-500"></i>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <i className="fa-solid fa-ghost text-gray-200 text-3xl mb-3"></i>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No history</p>
                  </div>
                )}
              </div>
            </aside>

            {/* DARK OVERLAY: Tap to close drawer */}
            {isArchiveOpen && (
              <div 
                className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-[55] md:hidden transition-opacity"
                onClick={() => setIsArchiveOpen(false)}
              ></div>
            )}

            {/* MAIN BOARD: Takes up full width on mobile */}
            <div className="flex-grow flex flex-col items-center overflow-hidden w-full px-1 md:px-0">
               <div className="w-full max-w-2xl flex-grow overflow-y-auto space-y-6 md:space-y-10 pb-12 pr-1 md:pr-4 custom-scrollbar">
                  <section>
                    <div className="flex items-center justify-between mb-4 md:mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-md py-4 z-10">
                      <div className="flex flex-col md:flex-row md:items-center gap-1">
                        <h2 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-tight">Message Board</h2>
                        <span className="bg-indigo-600 text-white text-[6px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md w-fit">Public</span>
                      </div>
                      
                      {/* HISTORY BUTTON: Visible only on phones */}
                      <button 
                        onClick={() => setIsArchiveOpen(true)}
                        className="md:hidden flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all"
                      >
                        <i className="fa-solid fa-clock-rotate-left"></i> History
                      </button>
                    </div>
                    
                    {user && (
                      <div className="mb-6 md:mb-12 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-indigo-50">
                         <h3 className="text-[9px] md:text-sm font-black uppercase text-indigo-600 mb-4 md:mb-6 flex items-center gap-2">
                           <i className="fa-solid fa-paper-plane"></i> Message Your Officials
                         </h3>
                         <form onSubmit={handlePostMessage} className="space-y-4 md:space-y-6">
                          <div className="space-y-2">
                            <label className="text-[8px] md:text-[10px] font-black uppercase text-gray-400 ml-1">1. Notify Officials</label>
                            
                            <div className="relative">
                              <button 
                                type="button"
                                onClick={() => setIsOfficialDropdownOpen(!isOfficialDropdownOpen)}
                                className="w-full bg-gray-50 p-3.5 rounded-2xl flex justify-between items-center text-[10px] md:text-sm font-bold text-gray-700 border-2 border-transparent focus:border-indigo-100 transition-all shadow-inner"
                              >
                                <div className="flex items-center gap-2">
                                   <i className="fa-solid fa-users-rectangle text-indigo-400"></i>
                                   <span className="truncate max-w-[140px] md:max-w-none">{selectedOfficials.length === 0 ? '-- Choose --' : `${selectedOfficials.length} Selected`}</span>
                                </div>
                                <i className={`fa-solid fa-chevron-${isOfficialDropdownOpen ? 'up' : 'down'} text-[9px] text-indigo-300`}></i>
                              </button>
                              
                              {isOfficialDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[70] max-h-72 md:max-h-96 flex flex-col overflow-hidden">
                                  <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar">
                                    {['Courthouse', 'Non-Courthouse', 'Council Members'].map(cat => (
                                      <div key={cat} className="space-y-2">
                                        <h4 className="text-[7px] font-black uppercase text-indigo-300 tracking-widest px-1">{cat}</h4>
                                        <div className="grid grid-cols-1 gap-1">
                                          {OFFICIALS.filter(o => o.category === cat).map(o => (
                                            <label key={o.id} className="flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-2xl cursor-pointer group transition-colors">
                                              <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer shrink-0" 
                                                checked={selectedOfficials.includes(o.name)}
                                                onChange={() => toggleOfficial(o.name)}
                                              />
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-black text-gray-800 group-hover:text-indigo-900 uppercase tracking-tight truncate">{o.name}</span>
                                                <span className="text-[7px] font-bold text-gray-400 truncate">{o.office}</span>
                                              </div>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center">
                                     <button 
                                       type="button" 
                                       onClick={() => setIsOfficialDropdownOpen(false)}
                                       className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg"
                                     >
                                       Done Selecting
                                     </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] md:text-[10px] font-black uppercase text-gray-400 ml-1">2. Message Content</label>
                            <textarea 
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message for public record..." 
                              className="w-full h-24 md:h-32 bg-gray-50 rounded-[1.2rem] md:rounded-3xl p-4 md:p-6 outline-none resize-none font-bold text-xs md:text-base text-gray-700 placeholder:text-gray-300 border-2 border-transparent focus:border-indigo-100 transition-all shadow-inner"
                            />
                          </div>

                          <div className="flex flex-col xs:flex-row justify-between items-center gap-3">
                             <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} className="flex items-center gap-2.5 group">
                                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${isAnonymous ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform transform ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="text-[8px] font-black uppercase text-gray-400">Post Anonymously</span>
                             </button>
                             <button type="submit" className="w-full xs:w-auto bg-indigo-600 text-white px-7 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-widest hover:shadow-2xl transition-all">Notify Officials</button>
                          </div>
                         </form>
                      </div>
                    )}

                    <div className="relative">
                      <div className={`space-y-6 md:space-y-10 transition-all ${!user ? 'blur-md select-none opacity-40 pointer-events-none' : ''}`}>
                        {filteredMessages.map(msg => (
                          <div key={msg.id} id={`msg-${msg.id}`} className="flex flex-col gap-3 md:gap-5 group">
                            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-sm border border-gray-100 relative transition-all group-hover:shadow-md">
                              <div className="flex justify-between items-start mb-3 md:mb-5">
                                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50/50 px-2 md:px-3 py-1 rounded-xl truncate max-w-[150px] md:max-w-[200px]">To: {msg.to}</span>
                                <span className="text-[7px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap ml-2">{msg.date}</span>
                              </div>
                              <p className="text-gray-800 text-xs md:text-base italic leading-relaxed mb-5 md:mb-8">"{msg.text}"</p>
                              <div className="pt-4 md:pt-5 border-t border-gray-50 flex justify-between items-center">
                                 <div className="flex flex-col min-w-0">
                                   <span className="text-[9px] md:text-xs font-black uppercase text-gray-900 tracking-tight truncate">{msg.user}</span>
                                   <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">{msg.district} Voter</span>
                                 </div>
                                 <i className="fa-solid fa-quote-right text-indigo-50 text-lg md:text-2xl group-hover:text-indigo-100 transition-colors"></i>
                              </div>
                            </div>
                            {msg.response ? (
                              <div className="ml-5 md:ml-12 bg-blue-50/40 p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border-l-8 border-blue-500 relative shadow-sm">
                                 <div className="flex items-center gap-2 mb-3">
                                   <span className="bg-blue-600 text-white text-[6px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">Reply</span>
                                   <span className="text-[8px] md:text-[10px] font-black text-blue-900 uppercase tracking-tighter truncate max-w-[140px]">{msg.response.author}</span>
                                 </div>
                                 <p className="text-blue-900 text-[10px] md:text-sm font-semibold leading-relaxed">"{msg.response.text}"</p>
                                 <span className="absolute bottom-2 right-4 text-[6px] md:text-[8px] font-black text-blue-300 uppercase">{msg.response.date}</span>
                              </div>
                            ) : (
                              <div className="ml-8 md:ml-16 border-l-4 border-gray-100 pl-4 py-2 flex items-center gap-2">
                                <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                <span className="text-[7px] md:text-[9px] font-black text-gray-300 uppercase tracking-[0.1em] italic">Waiting for official response</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!user && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 px-2">
                          <div className="bg-white/95 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-indigo-50 text-center max-w-sm">
                            <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-3xl shadow-inner animate-pulse">
                              <i className="fa-solid fa-user-lock"></i>
                            </div>
                            <h3 className="text-lg md:text-2xl font-black mb-2 text-gray-900 uppercase tracking-tighter">Verified Portal</h3>
                            <p className="text-gray-400 text-[10px] md:text-sm mb-6 leading-relaxed">Account required for official record engagement.</p>
                            <button onClick={() => setCurrentPage('signup')} className="w-full bg-indigo-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-widest shadow-lg">Join the Registry</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
               </div>
            </div>
          </div>
        )}

        {(currentPage === 'signup' || currentPage === 'login') && (
          <div className="max-w-lg mx-auto w-full px-1 pb-12 overflow-y-auto custom-scrollbar">
            <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-2xl shrink-0">
              <button onClick={() => setCurrentPage('signup')} className={`flex-1 py-2 rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition ${currentPage === 'signup' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>1. Register</button>
              <button onClick={() => setCurrentPage('login')} className={`flex-1 py-2 rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition ${currentPage === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>2. Login</button>
            </div>
            {currentPage === 'signup' ? (
              <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100">
                <h2 className="text-lg md:text-2xl font-black text-center mb-6 text-gray-900 uppercase tracking-tighter text-indigo-600 leading-tight">Voter Verification</h2>
                <form className="space-y-3.5" onSubmit={handleSignup}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input name="lastName" required placeholder="LAST NAME" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold uppercase text-[10px] md:text-xs shadow-inner" />
                    <input name="voterId" required placeholder="VOTER ID #" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-[10px] md:text-xs shadow-inner" />
                  </div>
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                       <label className="text-[7px] font-black uppercase text-indigo-300 ml-1">Birth Date</label>
                       <input type="date" name="dob" className="w-full p-2 bg-white rounded-lg text-[9px] md:text-[10px] font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[7px] font-black uppercase text-indigo-300 ml-1">Home Address</label>
                       <input name="address" placeholder="STREET NAME" className="w-full p-2 bg-white rounded-lg text-[9px] md:text-[10px] font-bold uppercase" />
                    </div>
                  </div>
                  <input type="email" name="email" required placeholder="Email Address" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-[10px] md:text-xs shadow-inner" />
                  <input type="password" name="password" required placeholder="Password" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-[10px] md:text-xs shadow-inner" />
                  <button disabled={isVerifying} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] md:text-sm uppercase shadow-lg">
                    {isVerifying ? 'Verifying Identity...' : 'Register'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-gray-100">
                <h2 className="text-lg md:text-2xl font-black text-center mb-6 text-gray-900 uppercase tracking-tighter text-indigo-600">Secure Access</h2>
                <form className="space-y-3" onSubmit={handleLogin}>
                  <input name="email" type="email" placeholder="Email Address" required className="w-full p-3.5 md:p-4 bg-gray-50 rounded-xl outline-none font-bold text-[10px] md:text-sm shadow-inner" />
                  <input name="password" type="password" placeholder="Password" required className="w-full p-3.5 md:p-4 bg-gray-50 rounded-xl outline-none font-bold text-[10px] md:text-sm shadow-inner" />
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] md:text-sm uppercase shadow-lg">Sign In</button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-2 md:py-3 px-6 text-center shrink-0">
        <p className="text-[6px] md:text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2024 transparency portal • Verified public records</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #e2e8f0; 
          border-radius: 20px; 
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
        
        /* Fixed Grid Scrolling for Mobile */
        @media (max-width: 640px) {
          .xs\:inline { display: inline !important; }
          .xs\:flex-row { flex-direction: row !important; }
        }
      `}</style>
    </div>
  );
}
