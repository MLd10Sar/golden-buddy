import React, { useState, useMemo, useEffect } from 'react';
import { Session, Invite, Interest, AreaId } from '../types';
import { MOCK_PEERS, AREAS } from '../constants';

interface DashboardProps {
  session: Session;
  invites: Invite[];
  remotePeers: Session[];
  onSendInvite: (toId: string, activity: Interest) => void;
  onRespond: (inviteId: string, action: 'ACCEPTED' | 'DECLINED', note?: string) => void;
  onReset: () => void;
}

interface ConfirmingInvite {
  buddyId: string;
  buddyName: string;
  activity: Interest;
}

const MEETING_SPOTS = [
  { name: 'Public Library Entrance', icon: '📚' },
  { name: 'Senior Center Lobby', icon: '🏢' },
  { name: 'Park Main Entrance Bench', icon: '🌳' },
  { name: 'Main Street Coffee Shop', icon: '☕' },
];

const SAFETY_TIPS = [
  { text: 'Meet in a public area.', icon: '👥' },
  { text: 'Tell a friend where you are.', icon: '📱' },
  { text: 'Trust your gut.', icon: '🛡️' },
];

export const Dashboard: React.FC<DashboardProps> = ({ session, invites, remotePeers, onSendInvite, onRespond, onReset }) => {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [confirmingInvite, setConfirmingInvite] = useState<ConfirmingInvite | null>(null);
  const [showDeclineNotice, setShowDeclineNotice] = useState<Invite | null>(null);
  const [acceptanceNote, setAcceptanceNote] = useState('');

  const incomingInvites = useMemo(() => {
    return invites.filter(inv => inv.toSessionId === session.id && inv.status === 'PENDING');
  }, [invites, session.id]);

  const allPeers = useMemo(() => {
    const userPrimaryInterest = session.interests[0];
    const userSecondaryInterests = session.interests.slice(1);

    const realPeers = remotePeers.map(p => ({
      id: p.id,
      displayName: p.displayName,
      areaId: p.areaId,
      interests: p.interests,
      distance: 'Live Nearby',
      buddySince: 'Joined Today',
      lastSeen: 'Online Now',
      isReal: true
    }));
    
    const mockPeers = MOCK_PEERS.map(p => ({ ...p, isReal: false }));
    const combined = [...realPeers, ...mockPeers];

    return combined.map(peer => {
      let score = 0;
      const peerInterests = peer.interests as Interest[];
      const peerPrimaryInterest = peerInterests[0];

      if (peer.areaId === session.areaId) score += 50;
      else if (session.areaId === 'exploring' || peer.areaId === 'exploring') score += 20;

      if (peerInterests.includes(userPrimaryInterest)) {
        score += 40;
        if (peerPrimaryInterest === userPrimaryInterest) score += 30;
      }

      userSecondaryInterests.forEach(interest => {
        if (peerInterests.includes(interest)) score += 15;
      });

      if (peer.isReal) score += 10;
      const matchPercentage = Math.min(Math.round((score / 130) * 100), 100);
      
      return { ...peer, score, matchPercentage, isPrimaryMatch: peerInterests.includes(userPrimaryInterest) };
    }).sort((a, b) => b.score - a.score);
  }, [session, remotePeers]);

  useEffect(() => {
    const recentlyDeclined = invites.find(inv => 
      inv.fromSessionId === session.id && 
      inv.status === 'DECLINED' && 
      (!inv.respondedAt || Date.now() - inv.respondedAt < 30000)
    );
    if (recentlyDeclined && !showDeclineNotice) setShowDeclineNotice(recentlyDeclined);
  }, [invites, session.id, showDeclineNotice]);

  const activeInvite = useMemo(() => {
    return invites.find(inv => inv.fromSessionId === session.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
  }, [invites, session.id]);

  const matchedBuddy = useMemo(() => {
    const buddyId = activeInvite?.toSessionId;
    return buddyId ? allPeers.find(p => p.id === buddyId) : null;
  }, [activeInvite, allPeers]);

  const getAreaName = (id: AreaId) => AREAS.find(a => a.id === id)?.name || id;

  if (selectedBuddyId) {
    const buddy = allPeers.find(b => b.id === selectedBuddyId);
    if (!buddy) { setSelectedBuddyId(null); return null; }

    const outgoingInvite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
    const isPending = outgoingInvite?.status === 'PENDING';
    const isAccepted = outgoingInvite?.status === 'ACCEPTED';

    return (
      <div className="p-6 animate-slideIn pb-24">
        <button onClick={() => setSelectedBuddyId(null)} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">← Back to List</button>
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-100 mb-8 text-center relative overflow-hidden">
          {buddy.isReal && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE</div>}
          <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-inner">👤</div>
          <h2 className="text-3xl font-bold mb-2">{buddy.displayName}</h2>
          <p className="text-slate-500 mb-6">{buddy.distance} • {buddy.matchPercentage}% Match</p>
          
          <div className="flex justify-center gap-8 mb-8 pb-6 border-b border-slate-50">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Buddy Since</p>
              <p className="font-bold text-slate-700">{buddy.buddySince}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Seen</p>
              <p className="font-bold text-slate-700">{buddy.lastSeen}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {buddy.interests.map(i => (
              <span key={i} className={`px-3 py-1 rounded-full text-sm font-semibold ${session.interests[0] === i ? 'bg-amber-500 text-white border-2 border-amber-300' : session.interests.includes(i as Interest) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{i}</span>
            ))}
          </div>

          <div className="space-y-4">
            {buddy.interests.map(activity => (
              <button 
                key={activity} 
                disabled={isPending || isAccepted || (!!activeInvite && !outgoingInvite)} 
                onClick={() => setConfirmingInvite({ buddyId: buddy.id, buddyName: buddy.displayName, activity: activity as Interest })}
                className={`w-full py-5 rounded-2xl text-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  isPending && outgoingInvite?.activity === activity ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 
                  isAccepted && outgoingInvite?.activity === activity ? 'bg-green-100 text-green-700 border-2 border-green-200 cursor-default' : 
                  !!activeInvite ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 
                  'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95'
                }`}
              >
                {isPending && outgoingInvite?.activity === activity ? '⏳ Invite Sent' : isAccepted && outgoingInvite?.activity === activity ? '✅ Walk Confirmed' : `Invite for ${activity}`}
              </button>
            ))}
          </div>
        </div>

        {confirmingInvite && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-scaleUp text-center">
              <h3 className="text-2xl font-black mb-4">Send Invitation?</h3>
              <p className="text-slate-600 mb-8 text-lg">Invite <span className="font-bold text-slate-900">{confirmingInvite.buddyName}</span> to go for a <span className="font-black text-amber-600 uppercase tracking-tight">{confirmingInvite.activity}</span>?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { onSendInvite(confirmingInvite.buddyId, confirmingInvite.activity); setConfirmingInvite(null); setSelectedBuddyId(null); }} className="w-full py-5 bg-amber-500 text-amber-950 font-black rounded-2xl text-xl shadow-lg transition-transform active:scale-95">Yes, Send Now</button>
                <button onClick={() => setConfirmingInvite(null)} className="w-full py-4 text-slate-400 font-bold rounded-2xl text-lg">Not Yet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderBuddyCard = (buddy: any) => {
    const invite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
    const isConfirmed = invite?.status === 'ACCEPTED';
    const isPending = invite?.status === 'PENDING';

    return (
      <button 
        key={buddy.id} 
        disabled={isPending || isConfirmed}
        onClick={() => setSelectedBuddyId(buddy.id)} 
        className={`w-full text-left p-5 rounded-[2.2rem] border-2 transition-all relative overflow-hidden group ${
          isConfirmed ? 'bg-green-50 border-green-400 shadow-sm cursor-default' : 
          isPending ? 'bg-slate-50 border-slate-300 grayscale opacity-75 cursor-not-allowed' : 
          buddy.matchPercentage > 80 ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-active:scale-95 ${
            isConfirmed ? 'bg-green-200 text-green-700' : isPending ? 'bg-slate-200 text-slate-400' : buddy.isReal ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {isConfirmed ? '✅' : isPending ? '⏳' : buddy.displayName[0]}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h4 className={`font-bold text-lg leading-tight ${isPending ? 'text-slate-400' : 'text-slate-800'}`}>{buddy.displayName}</h4>
                <p className="text-xs text-slate-400 font-medium">{buddy.distance}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-500 tracking-widest block uppercase">Match</span>
                <span className="text-lg font-black text-slate-700 leading-none">{buddy.matchPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-6 space-y-8 pb-32">
        
        {/* Confirmed Walk Mission Control */}
        {activeInvite?.status === 'ACCEPTED' && (
          <div className="animate-scaleUp">
             <div className="bg-green-600 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">✨</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Upcoming Walk</p>
                      <h2 className="text-2xl font-black">{activeInvite.activity} with {matchedBuddy?.displayName || 'Buddy'}</h2>
                    </div>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black border border-white/30 tracking-widest animate-pulse">LOCKED IN</span>
                </div>

                <div className="bg-white/10 rounded-3xl p-5 border border-white/20 mb-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Coordination Note</p>
                    <span className="text-[9px] font-bold opacity-60 italic">Personal message</span>
                  </div>
                  <p className="text-lg font-bold italic leading-relaxed">
                    "{activeInvite.coordinationNote || "I'll see you there!"}"
                  </p>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 pl-2">Meeting Suggestion</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {MEETING_SPOTS.slice(0, 2).map(spot => (
                        <div key={spot.name} className="bg-white/10 p-3 rounded-2xl flex items-center gap-3 border border-white/5">
                          <span className="text-xl">{spot.icon}</span>
                          <span className="text-[10px] font-bold leading-tight">{spot.name}</span>
                        </div>
                      ))}
                   </div>
                   
                   <div className="flex justify-around pt-4 border-t border-white/10">
                      {SAFETY_TIPS.map(tip => (
                        <div key={tip.text} className="flex flex-col items-center gap-1 opacity-80">
                           <span className="text-lg">{tip.icon}</span>
                           <span className="text-[8px] font-black uppercase tracking-tighter">{tip.text}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Normal Dashboard Header when not in Active Walk */}
        {(!activeInvite || activeInvite.status !== 'ACCEPTED') && (
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Find a Buddy</h2>
              <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
                <span className="text-lg">📍</span> {getAreaName(session.areaId)}
              </p>
            </div>
            <button onClick={onReset} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-200 pb-1 hover:text-slate-600 transition-colors">Reset</button>
          </div>
        )}

        {/* Discovery Sections */}
        {activeInvite?.status === 'PENDING' && (
          <div className="bg-amber-100 p-6 rounded-[2rem] border-2 border-amber-300 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⏳</span>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Waiting for Response</p>
                <p className="font-bold text-amber-800">Your invite to {allPeers.find(p => p.id === activeInvite.toSessionId)?.displayName} is out!</p>
              </div>
            </div>
          </div>
        )}

        {remotePeers.length > 0 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-[10px] font-black text-green-700 uppercase tracking-[0.3em] flex items-center gap-3 pl-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Neighbors Online Now
            </h3>
            <div className="space-y-4">{allPeers.filter(p => p.isReal).map(buddy => renderBuddyCard(buddy))}</div>
          </div>
        )}

        <div className="space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Suggested Buddies</h3>
          <div className="space-y-4">{allPeers.filter(p => !p.isReal).map(buddy => renderBuddyCard(buddy))}</div>
        </div>
      </div>

      {/* Incoming Invite Modal with Editable Note */}
      {incomingInvites.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-lg z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center relative overflow-hidden border-t-8 border-amber-400">
            <div className="text-7xl mb-6">🤝</div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">New Invite!</h3>
            <p className="text-slate-600 mb-8 text-lg">
              <span className="font-black text-slate-900">{allPeers.find(p => p.id === incomingInvites[0].fromSessionId)?.displayName || 'A Buddy'}</span> 
              <br/>invites you for a <span className="text-amber-600 font-black uppercase tracking-tight">{incomingInvites[0].activity}</span>.
            </p>
            
            <div className="mb-10 text-left bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">Write a coordination note</label>
              <textarea 
                rows={2}
                value={acceptanceNote}
                onChange={(e) => setAcceptanceNote(e.target.value)}
                placeholder="Example: 'I'll have a red t-shirt!'" 
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:border-green-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 resize-none text-lg"
              />
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Your buddy will see this note immediately.</p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { onRespond(incomingInvites[0].id, 'ACCEPTED', acceptanceNote); setAcceptanceNote(''); }} 
                className="w-full py-6 bg-green-500 hover:bg-green-600 text-white font-black rounded-[2rem] text-2xl shadow-xl transition-transform active:scale-95"
              >
                Accept & Meet
              </button>
              <button 
                onClick={() => { onRespond(incomingInvites[0].id, 'DECLINED'); setAcceptanceNote(''); }} 
                className="w-full py-4 text-slate-400 font-bold rounded-2xl text-lg hover:text-slate-600 transition-colors"
              >
                Not right now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Notification */}
      {showDeclineNotice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl text-center border-t-8 border-slate-400">
            <div className="text-5xl mb-6">🗓️</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Buddy Unavailable</h3>
            <p className="text-slate-600 mb-10 text-lg">
              <span className="font-bold text-slate-900">{allPeers.find(p => p.id === showDeclineNotice.toSessionId)?.displayName || 'Your buddy'}</span> isn't able to meet right now.
              <br/><br/>
              Try saying hello to another neighbor!
            </p>
            <button onClick={() => setShowDeclineNotice(null)} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl text-xl shadow-lg active:scale-95 transition-transform">Okay, understood</button>
          </div>
        </div>
      )}
    </div>
  );
};
