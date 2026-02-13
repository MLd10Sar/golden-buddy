
import React, { useState, useEffect, useRef } from 'react';
import { AppStep, UserPreferences, Invite, InviteState, Buddy } from './types';
import { AREAS, INTERESTS, INVITE_EXPIRY_MS } from './constants';
import { 
  ChevronLeft, 
  MapPin, 
  CheckCircle, 
  Clock, 
  XCircle,
  Users,
  ChevronRight,
  Navigation,
  Lightbulb,
  Globe,
  UserCheck,
  Heart,
  Zap,
  Flag,
  Sparkles
} from 'lucide-react';
import { getIcebreakers, getWalkPlan } from './geminiService';
import Gun from 'gun';

const APP_NAMESPACE = 'goldenbuddy-v2-stable';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(() => {
    try {
      const saved = localStorage.getItem('gb_step');
      return (saved as AppStep) || AppStep.WELCOME;
    } catch {
      return AppStep.WELCOME;
    }
  });

  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('gb_prefs');
      return saved ? JSON.parse(saved) : { 
        userName: '', 
        userId: Math.random().toString(36).substr(2, 9),
        selectedArea: '', 
        interests: [] 
      };
    } catch {
      return { 
        userName: '', 
        userId: Math.random().toString(36).substr(2, 9),
        selectedArea: '', 
        interests: [] 
      };
    }
  });

  const [invites, setInvites] = useState<Invite[]>([]);
  const [dynamicBuddies, setDynamicBuddies] = useState<Record<string, Buddy>>({});
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [walkPlan, setWalkPlanData] = useState<{locations: string[], theme: string} | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  
  const gunRef = useRef<any>(null);

  useEffect(() => {
    try {
      if (!gunRef.current) {
        gunRef.current = Gun([
          'https://gun-manhattan.herokuapp.com/gun',
          'https://relay.peer.ooo/gun'
        ]);
      }
    } catch (e) {
      console.error("Gun initialization failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!gunRef.current) return;
    if (prefs.userName && prefs.selectedArea) {
      const myProfile: Buddy = {
        id: prefs.userId,
        firstName: prefs.userName,
        area: prefs.selectedArea,
        interests: prefs.interests,
        distanceLabel: 'Nearby',
        lastSeen: Date.now()
      };
      
      gunRef.current.get(APP_NAMESPACE).get('profiles').get(prefs.userId).put(myProfile);
      
      const heartbeat = setInterval(() => {
        gunRef.current.get(APP_NAMESPACE).get('profiles').get(prefs.userId).get('lastSeen').put(Date.now());
      }, 30000);
      
      return () => clearInterval(heartbeat);
    }
  }, [prefs.userName, prefs.selectedArea, prefs.interests, prefs.userId]);

  useEffect(() => {
    if (!gunRef.current) return;

    const profilesRef = gunRef.current.get(APP_NAMESPACE).get('profiles');
    profilesRef.map().on((data: any, id: string) => {
      if (!data || id === prefs.userId) return;
      const buddyData = data as Buddy;
      if (Date.now() - buddyData.lastSeen < 900000) {
        setDynamicBuddies(prev => ({ ...prev, [id]: buddyData }));
      } else {
        setDynamicBuddies(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
      setIsSynced(true);
    });

    const inviteRef = gunRef.current.get(APP_NAMESPACE).get('invites');
    inviteRef.map().on((data: any, id: string) => {
      if (!data) return;
      const inviteData = data as Invite;
      if (inviteData.buddyId === prefs.userId || inviteData.senderId === prefs.userId) {
        setInvites(prev => {
          const existing = prev.findIndex(i => i.id === id);
          const newInvite = { ...inviteData, id };
          if (existing > -1) {
            const updated = [...prev];
            updated[existing] = newInvite;
            return updated;
          }
          return [newInvite, ...prev];
        });
      }
    });

    return () => {
      profilesRef.off();
      inviteRef.off();
    };
  }, [prefs.userId]);

  useEffect(() => { localStorage.setItem('gb_step', step); }, [step]);
  useEffect(() => { localStorage.setItem('gb_prefs', JSON.stringify(prefs)); }, [prefs]);

  // Automatic plan fetching when an invite is accepted
  useEffect(() => {
    const acceptedInvite = invites.find(i => i.state === InviteState.ACCEPTED);
    if (acceptedInvite && !walkPlan && !loadingPlan) {
      fetchInviteAddons(acceptedInvite);
    }
  }, [invites, walkPlan, loadingPlan]);

  const goToStep = (target: AppStep) => {
    setStep(target);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prefs.userName.trim()) {
      goToStep(AppStep.AREA_SELECTION);
    }
  };

  const sendInvite = (buddyId: string, buddyName: string) => {
    if (!gunRef.current) return;
    const inviteId = Math.random().toString(36).substr(2, 9);
    const newInvite: Omit<Invite, 'id'> = {
      buddyId,
      buddyName,
      senderName: prefs.userName,
      senderId: prefs.userId,
      state: InviteState.PENDING,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_EXPIRY_MS
    };

    gunRef.current.get(APP_NAMESPACE).get('invites').get(inviteId).put(newInvite);
    setSelectedBuddyId(null);
    goToStep(AppStep.INVITE_STATUS);
  };

  const updateInviteState = (inviteId: string, newState: InviteState) => {
    if (!gunRef.current) return;
    gunRef.current.get(APP_NAMESPACE).get('invites').get(inviteId).get('state').put(newState);
  };

  const fetchInviteAddons = async (invite: Invite) => {
    setLoadingPlan(true);
    try {
      const plan = await getWalkPlan(prefs.selectedArea, prefs.interests);
      setWalkPlanData(plan);
    } catch (e) {
      console.error("Failed to fetch walk plan", e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center space-y-12 py-16 px-8 text-center h-full animate-in fade-in duration-700">
      <div className="w-28 h-28 bg-amber-100 rounded-full flex items-center justify-center relative shadow-inner">
        <Users className="w-14 h-14 text-amber-600" />
        <div className="absolute top-1 right-1 w-7 h-7 bg-green-500 border-4 border-[#fffaf0] rounded-full animate-pulse shadow-sm"></div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">GoldenBuddy</h1>
        <p className="text-xl text-slate-600 font-medium max-w-xs mx-auto">Connecting neighborhood walkers in real-time.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-amber-200/50 shadow-sm max-w-xs">
        <p className="text-sm text-amber-900 leading-relaxed font-semibold">
          Find someone nearby to walk with right now. No signups, just neighborly connection.
        </p>
      </div>

      <button 
        type="button"
        onClick={() => goToStep(AppStep.NAME_ENTRY)}
        className="w-full max-w-sm bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-6 rounded-3xl text-2xl shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-3 group"
      >
        Start Now <ChevronRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderNameEntry = () => (
    <div className="space-y-10 p-8 animate-in slide-in-from-right duration-500">
      <button onClick={() => goToStep(AppStep.WELCOME)} className="text-slate-500 font-bold flex items-center gap-2 hover:text-amber-600 transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-slate-900 leading-tight">What should neighbors call you?</h2>
        <p className="text-slate-500 font-medium">Use your first name only for privacy.</p>
      </div>
      <form onSubmit={handleNameSubmit} className="space-y-8">
        <input 
          autoFocus
          type="text"
          placeholder="e.g. Margaret"
          value={prefs.userName}
          onChange={(e) => setPrefs(p => ({ ...p, userName: e.target.value }))}
          className="w-full bg-white border-b-4 border-slate-100 p-6 text-3xl font-black outline-none focus:border-amber-500 transition-all text-slate-800 placeholder:text-slate-200"
        />
        <button 
          disabled={!prefs.userName.trim()} 
          className="w-full bg-amber-500 text-white py-6 rounded-3xl font-black text-2xl shadow-xl disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95"
        >
          Continue
        </button>
      </form>
    </div>
  );

  const renderAreaSelection = () => (
    <div className="space-y-8 p-8 animate-in slide-in-from-right duration-500">
      <button onClick={() => goToStep(AppStep.NAME_ENTRY)} className="text-slate-500 font-bold flex items-center gap-2">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      <h2 className="text-4xl font-black text-slate-900 leading-tight">Where are you looking to walk?</h2>
      <div className="grid gap-4">
        {AREAS.map(area => (
          <button 
            key={area} 
            onClick={() => { setPrefs(p => ({...p, selectedArea: area})); goToStep(AppStep.INTEREST_SELECTION); }} 
            className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl text-left font-black text-xl flex justify-between items-center hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            {area} <MapPin className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderInterestSelection = () => (
    <div className="space-y-8 p-8 animate-in slide-in-from-right duration-500">
      <button onClick={() => goToStep(AppStep.AREA_SELECTION)} className="text-slate-500 font-bold flex items-center gap-2">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      <h2 className="text-4xl font-black text-slate-900 leading-tight">What are your walk vibes today?</h2>
      <div className="grid grid-cols-2 gap-4">
        {INTERESTS.map(int => (
          <button 
            key={int.id} 
            onClick={() => {
              setPrefs(p => {
                const interests = p.interests.includes(int.id) ? p.interests.filter(i => i !== int.id) : [...p.interests, int.id];
                return { ...p, interests };
              })
            }}
            className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${prefs.interests.includes(int.id) ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.05]' : 'border-slate-100 bg-white'}`}
          >
            <div className={`p-4 rounded-2xl ${prefs.interests.includes(int.id) ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
              {int.icon}
            </div>
            <span className="font-black text-sm uppercase tracking-wider">{int.label}</span>
          </button>
        ))}
      </div>
      <button 
        disabled={prefs.interests.length === 0} 
        onClick={() => goToStep(AppStep.BUDDY_LIST)} 
        className="w-full bg-amber-500 text-white py-6 rounded-3xl font-black text-2xl shadow-xl mt-6 disabled:bg-slate-200"
      >
        Finish & Join Local List
      </button>
    </div>
  );

  const renderBuddyList = () => {
    const buddies = (Object.values(dynamicBuddies) as Buddy[]).filter(b => b.area === prefs.selectedArea);
    return (
      <div className="space-y-8 p-8 animate-in slide-in-from-right duration-500">
        <div className="flex justify-between items-center">
          <button onClick={() => goToStep(AppStep.INTEREST_SELECTION)} className="text-slate-500 font-bold flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" /> Edit
          </button>
          <button onClick={() => goToStep(AppStep.INVITE_STATUS)} className="bg-amber-100 text-amber-700 px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">
            My Walks
          </button>
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 leading-tight">Neighbors Nearby</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{prefs.selectedArea}</p>
        </div>
        
        <div className="space-y-5">
          {buddies.length === 0 ? (
            <div className="py-24 text-center space-y-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <Users className="text-slate-300 w-8 h-8" />
              </div>
              <p className="text-slate-400 font-bold italic leading-relaxed px-6">
                You're the first one here! Keep this open — others in {prefs.selectedArea} will appear as soon as they join.
              </p>
            </div>
          ) : (
            buddies.map(buddy => {
              const isSelected = selectedBuddyId === buddy.id;
              return (
                <div key={buddy.id} className={`bg-white rounded-[2rem] border transition-all duration-300 ${isSelected ? 'border-amber-500 ring-[6px] ring-amber-100 scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
                  <div onClick={() => setSelectedBuddyId(isSelected ? null : buddy.id)} className="p-6 flex items-center gap-5 cursor-pointer">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.2rem] flex items-center justify-center font-black text-2xl border-2 border-amber-100/50">{buddy.firstName[0]}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-slate-800">{buddy.firstName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> 
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Now</span>
                      </div>
                    </div>
                    <ChevronRight className={`text-slate-300 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                  {isSelected && (
                    <div className="px-6 pb-6 pt-2 space-y-6 border-t border-slate-50 animate-in slide-in-from-top duration-300">
                      <div className="flex flex-wrap gap-2">
                        {buddy.interests.map(iId => (
                          <span key={iId} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${prefs.interests.includes(iId) ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-500'}`}>
                            {prefs.interests.includes(iId) && <Heart className="w-3 h-3 fill-current" />}
                            {INTERESTS.find(i => i.id === iId)?.label}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => sendInvite(buddy.id, buddy.firstName)} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">Send Walk Invite</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderInviteStatus = () => {
    const myReceived = invites.filter(i => i.buddyId === prefs.userId && i.state === InviteState.PENDING);
    const others = invites.filter(i => (i.senderId === prefs.userId) || (i.buddyId === prefs.userId && i.state !== InviteState.PENDING));

    return (
      <div className="space-y-8 p-8 animate-in slide-in-from-right duration-500">
        <button onClick={() => goToStep(AppStep.BUDDY_LIST)} className="text-slate-500 font-bold flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h2 className="text-4xl font-black text-slate-900 leading-tight">Your Walks</h2>
        
        {myReceived.map(inv => (
          <div key={inv.id} className="bg-amber-50 border-4 border-amber-200 p-8 rounded-[2.5rem] shadow-2xl space-y-6 animate-bounce-short">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800">{inv.senderName} wants to walk!</h3>
              <p className="text-amber-800 font-bold italic">Neighbor alert!</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => updateInviteState(inv.id, InviteState.DECLINED)} className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-500">Decline</button>
              <button onClick={() => updateInviteState(inv.id, InviteState.ACCEPTED)} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black text-xl shadow-lg">Accept</button>
            </div>
          </div>
        ))}

        <div className="space-y-5">
          {others.length === 0 && myReceived.length === 0 ? <p className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">No active walk history</p> : null}
          {others.sort((a,b) => b.createdAt - a.createdAt).map(inv => {
            const amISender = inv.senderId === prefs.userId;
            const isAccepted = inv.state === InviteState.ACCEPTED;
            return (
              <div key={inv.id} className={`p-6 bg-white rounded-[2rem] border-2 transition-all ${isAccepted ? 'border-green-200 ring-8 ring-green-50 shadow-md scale-[1.02]' : 'border-slate-100 shadow-sm'} space-y-6`}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-100 rounded-[1.1rem] flex items-center justify-center font-black text-xl text-slate-600">{amISender ? inv.buddyName[0] : inv.senderName[0]}</div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800">{amISender ? inv.buddyName : inv.senderName}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isAccepted ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{inv.state}</span>
                    </div>
                  </div>
                </div>

                {isAccepted && (
                  <div className="space-y-5 pt-5 border-t-2 border-slate-50 animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center gap-3 text-green-700 font-black bg-green-50 p-4 rounded-2xl">
                      <CheckCircle className="w-6 h-6" /> <span>Let's Go! Walk Accepted.</span>
                    </div>
                    
                    {loadingPlan ? (
                      <div className="p-5 bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center gap-3">
                        <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                        <p className="text-xs font-black uppercase text-amber-600 tracking-widest">Generating Walk Plan...</p>
                      </div>
                    ) : walkPlan && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 p-5 rounded-2xl space-y-3 border-2 border-amber-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <p className="font-black text-[10px] text-amber-500 uppercase tracking-widest">AI Walk Theme</p>
                          </div>
                          <p className="font-black text-amber-900 text-xl leading-tight">{walkPlan.theme}</p>
                        </div>

                        <div className="bg-blue-50 p-5 rounded-2xl space-y-3 border-2 border-blue-100 shadow-sm">
                          <p className="font-black text-[10px] text-blue-500 uppercase tracking-widest">Suggested Meeting Spot</p>
                          <div className="flex items-start gap-3">
                            <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                            <p className="font-black text-slate-800 text-lg leading-snug">{walkPlan.locations[0]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button onClick={() => updateInviteState(inv.id, InviteState.COMPLETED)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95">
                      <Flag className="w-5 h-5" /> Finish Walk
                    </button>
                  </div>
                )}
                
                {inv.state === InviteState.PENDING && amISender && (
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-3 italic">
                    <Clock className="w-4 h-4 animate-pulse" /> <span>Waiting for {inv.buddyName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#fffaf0] shadow-2xl flex flex-col relative overflow-x-hidden border-x border-amber-100/30">
      {step !== AppStep.WELCOME && (
        <header className="px-8 py-6 bg-white/80 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-center border-b-2 border-amber-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Users className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl text-slate-800 tracking-tight">GoldenBuddy</span>
          </div>
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[9px] font-black transition-all ${isSynced ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
            <Globe className={`w-3 h-3 ${isSynced ? 'animate-pulse' : ''}`} /> 
            {isSynced ? 'LIVE SYNC' : 'CONNECTING...'}
          </div>
        </header>
      )}
      
      <main className="flex-1 pb-12">
        {step === AppStep.WELCOME && renderWelcome()}
        {step === AppStep.NAME_ENTRY && renderNameEntry()}
        {step === AppStep.AREA_SELECTION && renderAreaSelection()}
        {step === AppStep.INTEREST_SELECTION && renderInterestSelection()}
        {step === AppStep.BUDDY_LIST && renderBuddyList()}
        {step === AppStep.INVITE_STATUS && renderInviteStatus()}
      </main>

      <footer className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
        Live Neighbor discovery • Privacy First
      </footer>
    </div>
  );
};

export default App;
