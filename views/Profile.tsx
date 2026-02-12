import React from 'react';
import { Session } from '../types';
import { AREAS } from '../constants';

interface ProfileViewProps {
  session: Session;
  onUpdateName: (name: string) => void;
  onBack: () => void;
  onEditInterests: () => void;
  onReset: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ session, onUpdateName, onBack, onEditInterests, onReset }) => {
  const areaName = AREAS.find(a => a.id === session.areaId)?.name || session.areaId;

  return (
    <div className="p-6 animate-fadeIn">
      <button onClick={onBack} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">
        ← Back to Buddies
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center mb-8">
        <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-inner border-4 border-white">
          👤
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-1">Your Buddy Card</h2>
        <p className="text-slate-500 text-sm mb-6">This is how neighbors see you.</p>

        <div className="space-y-6 text-left border-t border-slate-50 pt-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex justify-between items-center">
              Your Name
              <span className="text-amber-500 text-[9px]">Tap to change</span>
            </label>
            <input
              type="text"
              value={session.displayName}
              onChange={(e) => onUpdateName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xl font-bold text-slate-800 focus:border-amber-400 focus:bg-white outline-none transition-all"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Area</label>
            <p className="text-lg font-semibold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border-2 border-transparent">
              {areaName}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Activities You Like</label>
            <div className="flex flex-wrap gap-2">
              {session.interests.map((interest, idx) => (
                <span 
                  key={interest} 
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {idx === 0 && <span className="text-xs">★</span>}
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onEditInterests}
          className="w-full py-5 bg-white border-2 border-amber-200 text-amber-700 font-bold rounded-2xl text-lg hover:bg-amber-50 transition-colors shadow-sm"
        >
          Update Activities
        </button>

        <div className="pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
            Your info is saved only on your phone and deleted after 2 hours of inactivity.
          </p>
          <button 
            onClick={onReset}
            className="w-full py-4 text-red-500 font-bold text-sm border-2 border-red-50 rounded-2xl hover:bg-red-50 transition-colors"
          >
            End Session & Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};
