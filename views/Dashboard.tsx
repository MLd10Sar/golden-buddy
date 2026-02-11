import React, { useState, useMemo } from 'react';
import { Session, Invite, Interest, AreaId } from '../types';
import { MOCK_PEERS, AREAS } from '../constants';

interface DashboardProps {
  session: Session;
  invites: Invite[];
  remotePeers: Session[];
  onSendInvite: (toId: string, activity: Interest) => void;
  onRespond: (inviteId: string, action: 'ACCEPTED' | 'DECLINED') => void;
  onReset: () => void;
}

interface ConfirmingInvite {
  buddyId: string;
  buddyName: string;
  activity: Interest;
}

export const Dashboard: React.FC<DashboardProps> = ({ session, invites, remotePeers, onSendInvite, onRespond, onReset }) => {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [confirmingInvite, setConfirmingInvite] = useState<ConfirmingInvite | null>(null);

  const incomingInvites = useMemo(() => {
    return invites.filter(inv => inv.toSessionId === session.id && inv.status === 'PENDING');
  }, [invites, session.id]);

  const allPeers = useMemo(() => {
    const primaryInterest = session.interests[0];
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
      if (peer.areaId === session.areaId) score += 40;
      const peerInterests = peer.interests as Interest[];
      const hasPrimaryMatch = peerInterests.includes(primaryInterest);
      if (hasPrimaryMatch) {
        score += 60;
        if (peerInterests[0] === primaryInterest) score += 15;
      }
      const others = session.interests.slice(1).filter(i => peerInterests.includes(i) && i !== primaryInterest);
      score += (others.length * 20);
      const matchPercentage = Math.min(Math.round((score / 120) * 100), 100);
      return { ...peer, score, matchPercentage, isPrimaryMatch: hasPrimaryMatch };
    }).sort((a, b) => b.score - a.score);
  }, [session, remotePeers]);

  const activeInvite = useMemo(() => {
    return invites.find(inv => inv.fromSessionId === session.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
  }, [invites, session.id]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ACCEPTED': return 'bg-green-600 text-white border-green-700';
      case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getAreaName = (id: AreaId) => AREAS.find(a => a.id === id)?.name || id;

  if (selectedBuddyId) {
    const buddy = allPeers.find(b => b.id === selectedBuddyId);
    if (!buddy) { setSelectedBuddyId(null); return null; }

    const outgoingInvite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
    const isPending = outgoingInvite?.status === 'PENDING';
    const isAccepted = outgoingInvite?.status === 'ACCEPTED';

    return (
      <div className="p-6 animate-slideIn">
        <button onClick={() => setSelectedBuddyId(null)} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">← Back</button>
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 mb-8 text-center relative overflow-hidden">
          {buddy.isReal && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE</div>}
          {buddy.isPrimaryMatch && <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 px-4 py-1 font-bold text-[10px] uppercase tracking-widest rounded-bl-xl">Primary Match</div>}
          <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-inner">👤</div>
          <h2 className="text-3xl font-bold mb-2">{buddy.displayName}</h2>
          <p className="text-slate-500 mb-6">{buddy.distance} • {buddy.matchPercentage}% Match</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {buddy.interests.map(i => <span key={i} className={`px-3 py-1 rounded-full text-sm font-semibold ${session.interests.includes(i as Interest) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{i}</span>)}
          </div>
          <div className="space-y-4">
            {buddy.interests.map(activity => (
              <button 
                key={activity} 
                disabled={isPending || isAccepted || (!!activeInvite && !outgoingInvite)} 
                onClick={() => setConfirmingInvite({ buddyId: buddy.id, buddyName: buddy.displayName, activity: activity as Interest })}
                className={`w-full py-5 rounded-2xl text-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  isPending ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 
                  isAccepted ? 'bg-green-100 text-green-700 border-2 border-green-200 cursor-default' : 
                  !!activeInvite ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 
                  'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95'
                }`}
              >
                {isPending ? '⏳ Invite Sent' : isAccepted ? '✅ Walk Confirmed' : `Invite for ${activity}`}
              </button>
            ))}
          </div>
        </div>
        {confirmingInvite && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"><div className="bg-white rounded-3xl p-8 w-full max-sm shadow-2xl animate-scaleUp text-center">
            <h3 className="text-2xl font-bold mb-4">Confirm Invitation</h3>
            <p className="text-slate-600 mb-6">Invite <span className="font-bold">{confirmingInvite.buddyName}</span> for <span className="font-bold">{confirmingInvite.activity}</span>?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onSendInvite(confirmingInvite.buddyId, confirmingInvite.activity); setConfirmingInvite(null); setSelectedBuddyId(null); }} className="w-full py-4 bg-amber-500 text-amber-950 font-bold rounded-2xl text-lg shadow-md">Yes, Send Invite</button>
              <button onClick={() => setConfirmingInvite(null)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl text-lg">Maybe Later</button>
            </div>
          </div></div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {activeInvite && (
        <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 shadow-lg ${getStatusColor(activeInvite.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeInvite.status === 'ACCEPTED' ? '✨' : '⏳'}</span>
            <div>
              <p className="font-bold text-sm uppercase tracking-wide">
                {activeInvite.status === 'ACCEPTED' ? 'WALK CONFIRMED!' : 'WAITING FOR REPLY...'}
              </p>
              <p className="text-xs opacity-90">{activeInvite.activity} with {allPeers.find(p => p.id === activeInvite.toSessionId)?.displayName || 'Buddy'}</p>
            </div>
          </div>
          {activeInvite.status === 'ACCEPTED' && <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">READY</div>}
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div><h2 className="text-2xl font-bold">Find a Buddy</h2><p className="text-slate-500 text-sm">In {getAreaName(session.areaId)}</p></div>
          <button onClick={onReset} className="text-xs text-slate-400 underline">Reset</button>
        </div>

        {remotePeers.length > 0 && (
          <div className="bg-green-50/50 p-4 rounded-3xl border border-green-100 mb-4">
            <h3 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Buddies</h3>
            <div className="space-y-3">
              {allPeers.filter(p => p.isReal).map(buddy => {
                const invite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
                const isConfirmed = invite?.status === 'ACCEPTED';
                const isPending = invite?.status === 'PENDING';
                
                return (
                  <button 
                    key={buddy.id} 
                    disabled={isPending}
                    onClick={() => setSelectedBuddyId(buddy.id)} 
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      isConfirmed ? 'bg-green-50 border-green-300' : 
                      isPending ? 'bg-slate-50 border-slate-200 opacity-80 cursor-default' : 
                      'bg-white border-green-200 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${isConfirmed ? 'bg-green-200' : isPending ? 'bg-slate-200' : 'bg-green-50'}`}>
                        {isConfirmed ? '✅' : isPending ? '⏳' : buddy.displayName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-bold ${isPending ? 'text-slate-400' : 'text-slate-800'}`}>{buddy.displayName}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isConfirmed ? 'bg-green-100 text-green-700' : 
                            isPending ? 'bg-amber-100 text-amber-600' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {isConfirmed ? 'Confirmed' : isPending ? 'Invite Sent' : 'Live'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Suggested Buddies</h3>
          {allPeers.filter(p => !p.isReal).map((buddy) => {
            const invite = invites.find(inv => inv.fromSessionId === session.id && inv.toSessionId === buddy.id && (inv.status === 'PENDING' || inv.status === 'ACCEPTED'));
            const isConfirmed = invite?.status === 'ACCEPTED';
            const isPending = invite?.status === 'PENDING';

            return (
              <button 
                key={buddy.id} 
                disabled={isPending}
                onClick={() => setSelectedBuddyId(buddy.id)} 
                className={`w-full text-left p-5 rounded-3xl border transition-all ${
                  isConfirmed ? 'bg-green-50 border-green-300' : 
                  isPending ? 'bg-slate-50 border-slate-200 opacity-60 grayscale cursor-default' : 
                  buddy.isPrimaryMatch ? 'bg-white border-amber-300 active:scale-95' : 
                  'bg-white border-slate-200 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isConfirmed ? 'bg-green-200' : isPending ? 'bg-slate-200' : 'bg-amber-50'}`}>
                    {isConfirmed ? '✅' : isPending ? '⏳' : buddy.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className={`font-bold text-lg ${isPending ? 'text-slate-400' : 'text-slate-800'}`}>{buddy.displayName}</h3>
                      {isPending && <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full">SENT</span>}
                      {isConfirmed && <span className="text-[10px] bg-green-500 text-white font-black px-2 py-0.5 rounded-full">CONFIRMED</span>}
                    </div>
                    <p className="text-sm text-slate-500">{buddy.distance} • {buddy.matchPercentage}% match</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {incomingInvites.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-400"></div>
            <div className="text-5xl mb-6">👋</div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">New Invite!</h3>
            <p className="text-slate-600 mb-8 text-lg"><span className="font-bold text-slate-800">{allPeers.find(p => p.id === incomingInvites[0].fromSessionId)?.displayName || 'A Buddy'}</span> wants to go for a <span className="text-amber-600 font-bold">{incomingInvites[0].activity}</span>.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => onRespond(incomingInvites[0].id, 'ACCEPTED')} className="w-full py-5 bg-green-500 text-white font-bold rounded-2xl text-xl shadow-lg">Accept & Meet Up</button>
              <button onClick={() => onRespond(incomingInvites[0].id, 'DECLINED')} className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl text-lg">Not Today</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
