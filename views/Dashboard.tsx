import React, { useState, useMemo, useEffect } from 'react';
import { Session, Invite, Interest, AreaId } from '../types';
import { MOCK_PEERS, AREAS } from '../constants';

interface DashboardProps {
  session: Session;
  invites: Invite[];
  remotePeers: Session[];
  onSendInvite: (toId: string, activity: Interest) => void;
  onRespond: (inviteId: string, action: 'ACCEPTED' | 'DECLINED', note?: string) => void;
  onUpdateNote: (inviteId: string, note: string) => void;
  onReset: () => void;
}

const QUICK_RECOGNIZERS = [
  { label: 'Red Hat 🧢', value: 'I have a red hat' },
  { label: 'Blue Jacket 🧥', value: 'I have a blue jacket' },
  { label: 'On a Bench 🪑', value: "I'll be sitting on a bench" },
  { label: 'By the Entrance 🚪', value: "I'll be by the main entrance" },
  { label: 'Holding a Book 📖', value: "I'll be holding a book" },
  { label: 'By the Clock ⏰', value: "I'll be near the clock" },
];

const MEETING_SPOTS = [
  { name: 'Public Library', icon: '📚' },
  { name: 'Senior Center', icon: '🏢' },
  { name: 'Park Bench', icon: '🌳' },
  { name: 'Coffee Shop', icon: '☕' },
];

export const Dashboard: React.FC<DashboardProps> = ({ session, invites, remotePeers, onSendInvite, onRespond, onUpdateNote, onReset }) => {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [confirmingInvite, setConfirmingInvite] = useState<{ buddyId: string; buddyName: string; activity: Interest } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAcceptedId, setLastAcceptedId] = useState<string | null>(null);
  const [acceptanceNote, setAcceptanceNote] = useState('');
  const [isEditingMeetingNote, setIsEditingMeetingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');

  const incomingInvites = useMemo(() => {
    return invites.filter(inv => inv.toSessionId === session.id && inv.status === 'PENDING');
  }, [invites, session.id]);

  const activeInvite = useMemo(() => {
    return invites.find(inv => 
      (inv.fromSessionId === session.id || inv.toSessionId === session.id) && 
      (inv.status === 'PENDING' || inv.status === 'ACCEPTED')
    );
  }, [invites, session.id]);

  // Handle Celebration Animation when invite becomes ACCEPTED
  useEffect(() => {
    if (activeInvite?.status === 'ACCEPTED' && activeInvite.id !== lastAcceptedId) {
      setShowCelebration(true);
      setLastAcceptedId(activeInvite.id);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeInvite, lastAcceptedId]);

  const allPeers = useMemo(() => {
    const userPrimaryInterest = session.interests[0];
    const realPeers = remotePeers.map(p => ({
      id: p.id, displayName: p.displayName, areaId: p.areaId, interests: p.interests,
      distance: 'Live Nearby', isReal: true
    }));
    const combined = [...realPeers, ...MOCK_PEERS.map(p => ({ ...p, isReal: false }))];

    return combined.map(peer => {
      let score = 0;
      if (peer.areaId === session.areaId) score += 50;
      if (peer.interests.includes(userPrimaryInterest)) score += 40;
      const matchPercentage = Math.min(Math.round((score / 130) * 100) + 30, 100);
      return { ...peer, matchPercentage };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [session, remotePeers]);

  const matchedBuddy = useMemo(() => {
    const buddyId = activeInvite?.fromSessionId === session.id ? activeInvite?.toSessionId : activeInvite?.fromSessionId;
    return buddyId ? allPeers.find(p => p.id === buddyId) : null;
  }, [activeInvite, allPeers, session.id]);

  const isHeadingOver = activeInvite?.coordinationNote?.includes('Heading over now');

  const handleUpdateNote = (noteContent: string) => {
    if (activeInvite) {
      onUpdateNote(activeInvite.id, noteContent);
    }
  };

  const toggleHeadingOver = () => {
    if (!activeInvite) return;
    const currentNote = activeInvite.coordinationNote || '';
    let newNote = '';
    const headingText = '🚶 Heading over now!';
    if (isHeadingOver) {
      newNote = currentNote.replace(headingText, '').trim();
    } else {
      newNote = (currentNote ? currentNote + '. ' : '') + headingText;
    }
    handleUpdateNote(newNote);
  };

  if (selectedBuddyId) {
    const buddy = allPeers.find(b => b.id === selectedBuddyId);
    if (!buddy) { setSelectedBuddyId(null); return null; }
    const outgoingInvite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
    const isPending = outgoingInvite?.status === 'PENDING';
    const isAccepted = outgoingInvite?.status === 'ACCEPTED';

    return (
      <div className="p-6 animate-slideIn pb-24">
        <button onClick={() => setSelectedBuddyId(null)} className="mb-6 text-slate-500 font-black flex items-center gap-1 uppercase tracking-widest text-xs">← Back to neighbors</button>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-100 mb-8 text-center relative">
          <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl shadow-inner ring-4 ring-white">👤</div>
          <h2 className="text-4xl font-black mb-1 text-slate-900">{buddy.displayName}</h2>
          <p className="text-slate-500 font-bold mb-8 uppercase tracking-[0.2em] text-[10px]">{buddy.distance} Neighbor</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {buddy.interests.map(i => (
              <span key={i} className={`px-4 py-2 rounded-2xl text-sm font-black ${session.interests.includes(i as Interest) ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-500'}`}>{i}</span>
            ))}
          </div>

          <div className="space-y-4">
            {buddy.interests.map(activity => (
              <button key={activity} disabled={isPending || isAccepted || (!!activeInvite && activeInvite.status === 'PENDING')} onClick={() => setConfirmingInvite({ buddyId: buddy.id, buddyName: buddy.displayName, activity: activity as Interest })}
                className={`w-full py-6 rounded-3xl text-xl font-black transition-all shadow-md ${isPending && outgoingInvite?.activity === activity ? 'bg-slate-100 text-slate-400' : isAccepted && outgoingInvite?.activity === activity ? 'bg-green-500 text-white' : !!activeInvite ? 'bg-slate-50 text-slate-300' : 'bg-amber-500 text-amber-950 active:scale-95'}`}>
                {isPending && outgoingInvite?.activity === activity ? '⏳ Invite Sent' : isAccepted && outgoingInvite?.activity === activity ? '✅ Walk Confirmed' : `Go for a ${activity}`}
              </button>
            ))}
          </div>
        </div>

        {confirmingInvite && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-scaleUp text-center border-t-8 border-amber-500">
              <h3 className="text-2xl font-black mb-4">Send Invite?</h3>
              <p className="text-slate-600 mb-8 text-lg leading-snug">Ask <span className="font-black text-slate-900">{confirmingInvite.buddyName}</span> to go for a <span className="text-amber-600 font-black">{confirmingInvite.activity}</span>?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { onSendInvite(confirmingInvite.buddyId, confirmingInvite.activity); setConfirmingInvite(null); setSelectedBuddyId(null); }} className="w-full py-5 bg-amber-500 text-amber-950 font-black rounded-2xl text-xl shadow-lg active:scale-95">Send Invitation</button>
                <button onClick={() => setConfirmingInvite(null)} className="w-full py-4 text-slate-400 font-bold rounded-2xl text-lg">Wait, go back</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative p-6 space-y-8 pb-32">
      {/* Walk Celebration Animation Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-green-500/90 backdrop-blur-md animate-fadeIn">
          <div className="text-center text-white animate-scaleUp">
             <div className="text-9xl mb-6">✅</div>
             <h2 className="text-5xl font-black mb-2 tracking-tight">LOCKED IN!</h2>
             <p className="text-xl font-bold opacity-90">Neighbors walking together.</p>
          </div>
        </div>
      )}

      {/* Confirmed Walk - MISSION CONTROL */}
      {activeInvite?.status === 'ACCEPTED' && (
        <div className="animate-scaleUp">
          <div className={`rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${isHeadingOver ? 'bg-indigo-700' : 'bg-green-600'}`}>
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${isHeadingOver ? 'bg-white/20 border-white/40' : 'bg-black/20 border-white/20'}`}>
                {isHeadingOver ? '🏃 On My Way' : '✨ Confirmed'}
              </span>
            </div>

            <div className="flex items-center gap-5 mb-8 pt-2">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/10">👤</div>
              <div>
                <h2 className="text-3xl font-black leading-tight">{matchedBuddy?.displayName}</h2>
                <p className="font-bold text-white/80 flex items-center gap-2">
                  <span className="text-xl">👟</span> Going for a {activeInvite.activity}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 text-slate-800 shadow-xl mb-6 relative">
              <div className="absolute -top-3 left-8 w-6 h-6 bg-white rotate-45"></div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meeting Detail</p>
                <button onClick={() => { setTempNote(activeInvite.coordinationNote || ''); setIsEditingMeetingNote(true); }} className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-lg uppercase">Edit Note</button>
              </div>
              <p className="text-xl font-black italic leading-snug">
                "{activeInvite.coordinationNote || "I'll see you there!"}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {MEETING_SPOTS.slice(0, 2).map(spot => (
                <div key={spot.name} className="bg-white/10 p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                  <span className="text-2xl">{spot.icon}</span>
                  <span className="text-[10px] font-bold leading-tight uppercase tracking-tight">{spot.name}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={toggleHeadingOver} 
              className={`w-full py-6 rounded-[2rem] text-xl font-black transition-all shadow-xl active:scale-95 border-2 ${
                isHeadingOver ? 'bg-white text-indigo-700 border-white' : 'bg-slate-900 text-white border-slate-900'
              }`}
            >
              {isHeadingOver ? 'I have arrived!' : "I'm heading over now 🚶"}
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      {(!activeInvite || activeInvite.status !== 'ACCEPTED') && (
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Neighbors</h2>
            <p className="text-slate-500 font-bold text-sm flex items-center gap-2">📍 {AREAS.find(a => a.id === session.areaId)?.name}</p>
          </div>
          <button onClick={onReset} className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 pb-1">Reset</button>
        </div>
      )}

      {/* PENDING STATE */}
      {activeInvite?.status === 'PENDING' && (
        <div className="bg-amber-100 p-8 rounded-[2.5rem] border-2 border-amber-300 animate-pulse flex items-center gap-6">
          <div className="text-4xl">⏳</div>
          <div>
            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Invitation Pending</p>
            <p className="font-black text-amber-800 text-lg leading-tight">Waiting for {matchedBuddy?.displayName} to reply...</p>
          </div>
        </div>
      )}

      {/* NEIGHBOR LIST */}
      <div className="space-y-4">
        {allPeers.map(buddy => (
          <button key={buddy.id} onClick={() => setSelectedBuddyId(buddy.id)} className="w-full text-left p-6 rounded-[2.5rem] bg-white border-2 border-slate-100 shadow-sm flex items-center gap-6 hover:border-amber-400 hover:shadow-md transition-all group">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner group-active:scale-90 transition-transform ${buddy.isReal ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
              {buddy.displayName[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-black text-xl text-slate-900 leading-tight">{buddy.displayName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{buddy.distance}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-amber-500 block uppercase tracking-tighter">Match</span>
                  <span className="text-2xl font-black text-slate-800 leading-none">{buddy.matchPercentage}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${buddy.matchPercentage}%` }}></div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ACCEPTANCE MODAL */}
      {incomingInvites.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl text-center border-t-8 border-amber-500 overflow-y-auto max-h-[90vh]">
             <div className="text-7xl mb-6">🤝</div>
             <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight leading-none">Walk Invite!</h3>
             <p className="text-slate-600 mb-10 text-xl leading-snug">
               <span className="font-black text-slate-900">{allPeers.find(p => p.id === incomingInvites[0].fromSessionId)?.displayName}</span> 
               <br/>asks to go for a <span className="text-amber-600 font-black uppercase tracking-tight">{incomingInvites[0].activity}</span>.
             </p>
             
             <div className="mb-10 text-left space-y-4">
                <textarea rows={2} value={acceptanceNote} onChange={(e) => setAcceptanceNote(e.target.value)} placeholder="e.g. 'I'll be in a blue jacket!'" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-4 font-black text-slate-800 focus:border-green-500 outline-none resize-none text-xl" />
                <div className="flex flex-wrap gap-2">
                  {QUICK_RECOGNIZERS.slice(0, 3).map(r => (
                    <button key={r.label} onClick={() => setAcceptanceNote(prev => prev ? `${prev}. ${r.value}` : r.value)} className="bg-amber-100 text-amber-800 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-tight">{r.label}</button>
                  ))}
                </div>
             </div>

             <div className="flex flex-col gap-4">
               <button onClick={() => { onRespond(incomingInvites[0].id, 'ACCEPTED', acceptanceNote); setAcceptanceNote(''); }} className="w-full py-6 bg-green-500 text-white font-black rounded-[2.5rem] text-2xl shadow-xl active:scale-95 transition-transform border-b-4 border-green-700">Accept & Walk</button>
               <button onClick={() => { onRespond(incomingInvites[0].id, 'DECLINED'); setAcceptanceNote(''); }} className="w-full py-4 text-slate-400 font-bold rounded-2xl text-lg">Not right now</button>
             </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditingMeetingNote && activeInvite && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-lg z-[210] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto border-t-8 border-green-500">
            <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-none">Update Note 📝</h3>
            <div className="mb-8 space-y-8">
              <textarea rows={3} value={tempNote} onChange={(e) => setTempNote(e.target.value)} placeholder="Help your buddy find you..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-[2rem] px-6 py-5 font-black text-slate-800 focus:border-green-500 outline-none resize-none text-xl" />
              <div className="grid grid-cols-2 gap-3">
                {QUICK_RECOGNIZERS.map(r => (
                  <button key={r.label} onClick={() => setTempNote(prev => prev ? `${prev}. ${r.value}` : r.value)} className="bg-slate-100 text-slate-700 text-[10px] font-black p-4 rounded-2xl uppercase border-2 border-transparent hover:border-amber-400 transition-colors">
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => { handleUpdateNote(tempNote); setIsEditingMeetingNote(false); }} className="w-full py-5 bg-green-500 text-white font-black rounded-[2rem] text-xl shadow-lg active:scale-95 border-b-4 border-green-700">Save Update</button>
              <button onClick={() => setIsEditingMeetingNote(false)} className="w-full py-4 text-slate-400 font-bold rounded-2xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
