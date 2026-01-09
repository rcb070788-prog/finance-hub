import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, DASHBOARDS, OFFICIALS } from './constants.ts';
import { DashboardConfig } from './types.ts';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- UTILITIES ---
const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all" onClick={(e) => e.stopPropagation()}>
          {part} <i className="fa-solid fa-external-link text-[8px] ml-1"></i>
        </a>
      );
    }
    return part;
  });
};

// --- NEW COMPONENT: USER AVATAR ---
const UserAvatar = ({ url, isAnonymous, size = "md" }: { url?: string, isAnonymous?: boolean, size?: "sm" | "md" | "lg" }) => {
  const dims = size === "sm" ? "w-6 h-6 text-[8px]" : size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-xs";
  
  if (isAnonymous) {
    return (
      <div className={`${dims} bg-gray-200 text-gray-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0`}>
        <i className="fa-solid fa-user-shield"></i>
      </div>
    );
  }

  return (
    <div className={`${dims} bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0`}>
      {url ? (
        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <i className="fa-solid fa-user"></i>
      )}
    </div>
  );
};

export default function App() {
  // --- STATE ---
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeDashboard, setActiveDashboard] = useState<DashboardConfig | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState<{pollId: string, optionId: string, optionText: string, isAnonymous: boolean} | null>(null);
  
  // New State for Features
  const [registryModal, setRegistryModal] = useState<{optionText: string, voters: any[]} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficials, setSelectedOfficials] = useState<string[]>([]);
  const [isOfficialDropdownOpen, setIsOfficialDropdownOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    fetchAllData();
    return () => subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
  };

  const fetchPolls = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options(*),
        poll_votes(*, profiles(full_name, district, avatar_url)),
        poll_comments(*, profiles(full_name, district, avatar_url), comment_reactions(*))
      `)
      .order('created_at', { ascending: false });
    if (data) setPolls(data);
  };

  const fetchSuggestions = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('suggestions').select('*, profiles(full_name, district)').order('created_at', { ascending: false });
    setSuggestions(data || []);
  };

  const fetchBoardMessages = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('board_messages').select('*, profiles(full_name, district)').order('created_at', { ascending: false });
    setBoardMessages(data || []);
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    setAllUsers(data || []);
  };

  const fetchAllData = () => { fetchPolls(); fetchSuggestions(); fetchBoardMessages(); };
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return boardMessages;
    const q = searchQuery.toLowerCase();
    return boardMessages.filter(m => 
      m.profiles?.full_name?.toLowerCase().includes(q) || 
      m.recipient_names?.toLowerCase().includes(q) || 
      m.content?.toLowerCase().includes(q)
    );
  }, [boardMessages, searchQuery]);

  // --- PHOTO UPLOAD LOGIC ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      fetchProfile(user.id);
      showToast("Profile Photo Updated");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- VOTING LOGIC ---
  const confirmVote = async () => {
    if (!pendingVote || !supabase) return;
    const { error } = await supabase.from('poll_votes').upsert(
      { 
        poll_id: pendingVote.pollId, 
        option_id: pendingVote.optionId, 
        user_id: user.id, 
        is_anonymous: Boolean(pendingVote.isAnonymous) 
      },
      { onConflict: 'poll_id,user_id' }
    );
    if (error) showToast(error.message, 'error');
    else { showToast("Vote recorded"); fetchPolls(); }
    setPendingVote(null);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden relative">
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white z-[300] shadow-2xl transition-all ${toast.type === 'success' ? 'bg-indigo-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* --- VOTER REGISTRY MODAL --- */}
      {registryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase text-gray-900">Voter Registry</h3>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{registryModal.optionText}</p>
              </div>
              <button onClick={() => setRegistryModal(null)} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-circle-xmark text-2xl"></i></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2">
              {registryModal.voters.map((v, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                  <UserAvatar url={v.profiles?.avatar_url} isAnonymous={v.is_anonymous} size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-800">
                      {v.is_anonymous ? "Verified Voter" : v.profiles?.full_name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      District {v.profiles?.district}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="bg-white shadow-sm px-4 py-3 z-50 shrink-0 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center cursor-pointer" onClick={() => { setCurrentPage('home'); setSelectedCategory(null); }}>
            <i className="fa-solid fa-landmark text-indigo-600 text-xl mr-2"></i>
            <span className="text-lg font-bold uppercase tracking-tighter text-gray-900">Finance Hub</span>
          </div>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="bg-gray-100 p-2.5 rounded-xl text-gray-600"><i className="fa-solid fa-bars-staggered"></i></button>
      </nav>

      {/* --- SIDEBAR MENU --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-80 bg-white h-full shadow-2xl p-8 flex flex-col">
             {user && (
               <div className="relative mb-8 group flex flex-col items-center text-center">
                  <div className="relative">
                    <UserAvatar url={profile?.avatar_url} size="lg" />
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-lg hover:scale-110 transition-transform">
                      <i className={`fa-solid ${isUploading ? 'fa-spinner animate-spin' : 'fa-camera'} text-[10px]`}></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-black text-gray-900 uppercase">{profile?.full_name}</p>
                    <p className="text-[9px] font-black uppercase text-gray-400">District {profile?.district} Voter</p>
                  </div>
               </div>
             )}
             <div className="space-y-4">
                <button onClick={() => { setCurrentPage('home'); setSelectedCategory(null); setIsMenuOpen(false); }} className="text-xl font-black uppercase text-gray-800 flex items-center gap-3">
                  <i className="fa-solid fa-house text-indigo-600"></i> Home
                </button>
                <button onClick={() => { setCurrentPage('polls'); setSelectedPoll(null); setIsMenuOpen(false); fetchPolls(); }} className="text-xl font-black uppercase text-gray-800 flex items-center gap-3">
                  <i className="fa-solid fa-square-poll-vertical text-indigo-600"></i> Polls
                </button>
                <button onClick={() => { setCurrentPage('board'); setIsMenuOpen(false); fetchBoardMessages(); }} className="text-xl font-black uppercase text-gray-800 flex items-center gap-3">
                  <i className="fa-solid fa-comments text-indigo-600"></i> Let's Talk
                </button>
                <button onClick={() => { setCurrentPage('suggestions'); setIsMenuOpen(false); fetchSuggestions(); }} className="text-xl font-black uppercase text-gray-800 flex items-center gap-3">
                  <i className="fa-solid fa-lightbulb text-indigo-600"></i> Suggestions
                </button>
                {profile?.is_admin && (
                  <button onClick={() => { setCurrentPage('admin'); setIsMenuOpen(false); fetchUsers(); }} className="text-xl font-black uppercase text-red-600 flex items-center gap-3">
                    <i className="fa-solid fa-user-shield"></i> Admin
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow overflow-y-auto container mx-auto px-4 py-8 custom-scrollbar">
        
        {/* HOME PAGE */}
        {currentPage === 'home' && !selectedCategory && (
          <div className="max-w-4xl mx-auto space-y-12 py-10 text-center">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Moore County Hub</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {CATEGORIES.map(cat => (
                 <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-8 rounded-[2.5rem] shadow-sm border hover:shadow-xl transition-all cursor-pointer flex items-center gap-6 text-left">
                   <div className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl`}><i className={`fa-solid ${cat.icon}`}></i></div>
                   <div><h3 className="text-xl font-black uppercase">{cat.label}</h3><p className="text-gray-400 text-xs font-bold uppercase">View Data</p></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* POLL LIST */}
        {currentPage === 'polls' && !selectedPoll && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-black uppercase">Community Polls</h2>
            <div className="grid grid-cols-1 gap-4">
              {polls.map(poll => (
                <div key={poll.id} onClick={() => setSelectedPoll(poll)} className="bg-white p-8 rounded-[2.5rem] border hover:shadow-lg cursor-pointer flex justify-between items-center transition-all">
                  <h3 className="text-xl font-black uppercase">{poll.title}</h3>
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase">Vote</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INDIVIDUAL POLL VIEW */}
        {currentPage === 'polls' && selectedPoll && (
          <div className="max-w-3xl mx-auto space-y-8">
            <button onClick={() => setSelectedPoll(null)} className="text-[10px] font-black uppercase text-gray-400"><i className="fa-solid fa-arrow-left mr-2"></i>Back</button>
            <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-8">
              <h2 className="text-3xl font-black uppercase leading-none">{selectedPoll.title}</h2>
              <div className="space-y-6">
                {selectedPoll.poll_options?.map((opt: any) => {
                  const votes = selectedPoll.poll_votes?.filter((v: any) => v.option_id === opt.id) || [];
                  const totalPollVotes = selectedPoll.poll_votes?.length || 0;
                  const percent = totalPollVotes ? Math.round((votes.length / totalPollVotes) * 100) : 0;
                  const hasVotedAny = selectedPoll.poll_votes?.some((v: any) => v.user_id === user?.id);

                  return (
                    <div key={opt.id} className="space-y-2">
                      <button 
                        onClick={() => !hasVotedAny && setPendingVote({ pollId: selectedPoll.id, optionId: opt.id, optionText: opt.text, isAnonymous: false })}
                        className={`w-full p-6 rounded-2xl border-2 transition-all relative overflow-hidden flex justify-between items-center ${hasVotedAny ? 'border-gray-50' : 'border-indigo-100 hover:border-indigo-600'}`}
                      >
                         {hasVotedAny && <div className="absolute inset-y-0 left-0 bg-indigo-50" style={{ width: `${percent}%`, zIndex: 0 }}></div>}
                         <span className="relative z-10 text-xs font-black uppercase text-gray-700">{opt.text}</span>
                         {hasVotedAny && (
                           <div className="relative z-10 text-right">
                             <span className="text-sm font-black text-indigo-600">{percent}%</span>
                             <span className="block text-[8px] font-bold text-gray-400 uppercase">({votes.length} Votes)</span>
                           </div>
                         )}
                      </button>
                      {hasVotedAny && votes.length > 0 && (
                        <div className="flex items-center gap-2 px-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setRegistryModal({ optionText: opt.text, voters: votes })}>
                          <div className="flex -space-x-2 overflow-hidden">
                            {votes.slice(0, 5).map((v: any, i: number) => <UserAvatar key={i} url={v.profiles?.avatar_url} isAnonymous={v.is_anonymous} size="sm" />)}
                          </div>
                          {votes.length > 5 && <span className="text-[9px] font-black text-gray-400 uppercase">+ {votes.length - 5} More</span>}
                          <span className="text-[8px] font-black text-indigo-400 uppercase ml-auto">View Full Registry</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PUBLIC RECORD BOARD */}
        {currentPage === 'board' && (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-black uppercase">Public Record</h2>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search messages..." className="p-3 bg-white border rounded-xl text-[10px] w-64 outline-none" />
            </div>

            {user && (
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  if (selectedOfficials.length === 0) return showToast("Select an official", "error");
                  const { error } = await supabase!.from('board_messages').insert({ user_id: user.id, content: fd.get('content'), recipient_names: selectedOfficials.join(', '), district: profile.district });
                  if (error) showToast(error.message, 'error');
                  else { showToast("Message Posted"); setSelectedOfficials([]); (e.target as HTMLFormElement).reset(); fetchBoardMessages(); }
                }} className="space-y-4">
                  <div className="relative">
                    <button type="button" onClick={() => setIsOfficialDropdownOpen(!isOfficialDropdownOpen)} className="w-full p-4 bg-indigo-700 text-white rounded-2xl text-left text-[10px] font-black uppercase flex justify-between">
                      <span>{selectedOfficials.length > 0 ? `To: ${selectedOfficials.join(', ')}` : "Select Recipients"}</span>
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                    {isOfficialDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl z-[60] p-4 grid grid-cols-2 gap-2">
                        {OFFICIALS.map(off => (
                          <label key={off.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input type="checkbox" checked={selectedOfficials.includes(off.name)} onChange={(e) => {
                              if (e.target.checked) setSelectedOfficials([...selectedOfficials, off.name]);
                              else setSelectedOfficials(selectedOfficials.filter(n => n !== off.name));
                            }} />
                            <span className="text-[10px] font-bold uppercase">{off.name}</span>
                          </label>
                        ))}
                        <button type="button" onClick={() => setIsOfficialDropdownOpen(false)} className="col-span-2 mt-2 py-2 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase">Close List</button>
                      </div>
                    )}
                  </div>
                  <textarea name="content" required placeholder="Type your public message..." className="w-full p-6 bg-white rounded-[1.5rem] text-sm min-h-[100px] outline-none" />
                  <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs">Post Public Record</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar url={msg.profiles?.avatar_url} size="md" />
                      <div>
                        <p className="text-xs font-black uppercase">{msg.profiles?.full_name}</p>
                        <p className="text-[9px] font-bold text-indigo-600 uppercase">District {msg.profiles?.district}</p>
                      </div>
                    </div>
                    <div className="text-right flex gap-1">
                      {msg.recipient_names?.split(', ').map((name: string) => (
                        <span key={name} className="px-2 py-1 bg-gray-100 rounded text-[7px] font-black text-gray-400">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-gray-700 text-sm">{renderTextWithLinks(msg.content)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUGGESTIONS PAGE */}
        {currentPage === 'suggestions' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-black uppercase text-center">Project Suggestions</h2>
            {user && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const { error } = await supabase!.from('suggestions').insert({
                  user_id: user.id, title: fd.get('title'), description: fd.get('description'), category: fd.get('category')
                });
                if (error) showToast(error.message, 'error');
                else { showToast("Suggestion Submitted"); fetchSuggestions(); (e.target as HTMLFormElement).reset(); }
              }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-dashed border-indigo-100 space-y-4">
                <input name="title" required placeholder="PROJECT TITLE" className="w-full p-4 bg-gray-50 rounded-xl text-xs font-black uppercase" />
                <textarea name="description" required placeholder="Explain your suggestion..." className="w-full p-4 bg-gray-50 rounded-xl text-xs min-h-[100px]" />
                <div className="flex gap-4">
                  <select name="category" className="bg-gray-50 p-4 rounded-xl text-[10px] font-black uppercase">
                    <option>Infrastructure</option><option>Education</option><option>Public Safety</option><option>Parks & Rec</option>
                  </select>
                  <button className="flex-grow py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">Submit Idea</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestions.map(sug => (
                <div key={sug.id} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[8px] font-black uppercase mb-3 inline-block">{sug.category}</span>
                  <h4 className="text-lg font-black uppercase mb-2 leading-tight">{sug.title}</h4>
                  <p className="text-gray-500 text-xs mb-4">{sug.description}</p>
                  <div className="text-[9px] font-black uppercase text-gray-400">By {sug.profiles?.full_name} • Dist {sug.profiles?.district}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN PAGE */}
        {currentPage === 'admin' && profile?.is_admin && (
          <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="text-4xl font-black uppercase">Admin Center</h2>
            <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b font-black uppercase text-gray-400">
                  <tr><th className="p-6">Voter Name</th><th className="p-6">District</th><th className="p-6">Voter ID</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(u => (
                    <tr key={u.id}>
                      <td className="p-6 font-bold">{u.full_name}</td>
                      <td className="p-6 uppercase">District {u.district}</td>
                      <td className="p-6 font-mono text-gray-400">{u.voter_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --- VOTING CONFIRMATION MODAL --- */}
      {pendingVote && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase text-center">Confirm Vote</h3>
            <p className="text-center text-sm text-gray-500 font-bold">"{pendingVote.optionText}"</p>
            <div className="bg-gray-50 p-6 rounded-2xl flex justify-between items-center">
              <span className="text-[10px] font-black uppercase">Anonymize Identity</span>
              <button 
                onClick={() => setPendingVote({...pendingVote, isAnonymous: !pendingVote.isAnonymous})}
                className={`w-12 h-6 rounded-full relative transition-all ${pendingVote.isAnonymous ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pendingVote.isAnonymous ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <button onClick={confirmVote} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs">Submit Vote</button>
            <button onClick={() => setPendingVote(null)} className="w-full text-gray-400 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
}