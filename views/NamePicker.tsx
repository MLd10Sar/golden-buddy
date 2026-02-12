import React from 'react';

interface NamePickerProps {
  name: string;
  onSetName: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const NamePicker: React.FC<NamePickerProps> = ({ name, onSetName, onNext, onBack }) => {
  return (
    <div className="p-6 animate-fadeIn">
      <button onClick={onBack} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">
        ← Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 mb-2">What's your name?</h2>
        <p className="text-slate-600">This is what your neighbors will see.</p>
      </div>

      <div className="mb-12">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Your Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => onSetName(e.target.value)}
          placeholder="e.g. Martha"
          className="w-full bg-white border-2 border-slate-200 rounded-2xl p-5 text-xl font-bold text-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
        />
        <p className="mt-4 text-xs text-slate-400 italic">
          Only your first name is needed. Keep it simple!
        </p>
      </div>

      <button
        disabled={!name.trim()}
        onClick={onNext}
        className={`w-full py-5 rounded-2xl text-xl font-bold shadow-lg transition-all ${
          name.trim() 
            ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );
};
