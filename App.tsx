import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, DASHBOARDS, OFFICIALS } from './constants.ts';
import { DashboardConfig } from './types.ts';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  
  // New State for Registry Modal
  const [registryModal, setRegistryModal] = useState<{optionText: string, voters: any[]} | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const fetchAllData = () => { fetchPolls(); fetchSuggestions(); fetchBoardMessages(); };
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- PHOTO UPLOAD LOGIC ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile table
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
      {toast && <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-indigo-600 text-white z-[300] shadow-2xl">{toast.message}</div>}

      {/* --- VOTER REGISTRY MODAL (The Expansion) --- */}
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

      {/* Existing Nav Code... */}
      <nav className="bg-white shadow-sm px-4 py-3 z-50 shrink-0 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
            <i className="fa-solid fa-landmark text-indigo-600 text-xl mr-2"></i>
            <span className="text-lg font-bold uppercase tracking-tighter text-gray-900">Finance Hub</span>
          </div>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="bg-gray-100 p-2.5 rounded-xl text-gray-600"><i className="fa-solid fa-bars-staggered"></i></button>
      </nav>

      {/* MENU WITH PHOTO UPLOAD */}
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
                <button onClick={() => { setCurrentPage('polls'); setIsMenuOpen(false); fetchPolls(); }} className="text-xl font-black uppercase text-gray-800 flex items-center gap-3">
                  <i className="fa-solid fa-square-poll-vertical text-indigo-600"></i> Polls
                </button>
                {/* Other menu items... */}
             </div>
          </div>
        </div>
      )}

      <main className="flex-grow overflow-y-auto container mx-auto px-4 py-8">
        {currentPage === 'polls' && selectedPoll && (
          <div className="max-w-3xl mx-auto space-y-8">
            <button onClick={() => setSelectedPoll(null)} className="text-[10px] font-black uppercase text-gray-400">Back</button>
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

                      {/* FACEPILE REGISTRY */}
                      {hasVotedAny && votes.length > 0 && (
                        <div 
                          className="flex items-center gap-2 px-2 cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => setRegistryModal({ optionText: opt.text, voters: votes })}
                        >
                          <div className="flex -space-x-2 overflow-hidden">
                            {votes.slice(0, 5).map((v: any, i: number) => (
                              <UserAvatar key={i} url={v.profiles?.avatar_url} isAnonymous={v.is_anonymous} size="sm" />
                            ))}
                          </div>
                          {votes.length > 5 && (
                            <span className="text-[9px] font-black text-gray-400 uppercase">
                              + {votes.length - 5} More
                            </span>
                          )}
                          <span className="text-[8px] font-black text-indigo-400 uppercase ml-auto">View Full Registry <i className="fa-solid fa-chevron-right ml-1"></i></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- VOTING MODAL --- */}
      {pendingVote && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase text-center">Confirm Vote</h3>
            <p className="text-center text-sm text-gray-500 font-bold">"{pendingVote.optionText}"</p>
            <div className="bg-gray-50 p-6 rounded-2xl flex justify-between items-center">
              <span className="text-[10px] font-black uppercase">Anonymize my Identity</span>
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
    </div>
  );
}