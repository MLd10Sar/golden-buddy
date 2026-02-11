
import React from 'react';
import { INTERESTS } from '../constants';
import { Interest } from '../types';

interface InterestPickerProps {
  selectedInterests: Interest[];
  onToggle: (interest: Interest) => void;
  onNext: () => void;
  onBack: () => void;
}

export const InterestPicker: React.FC<InterestPickerProps> = ({ selectedInterests, onToggle, onNext, onBack }) => {
  const isAnythingSelected = selectedInterests.length > 0;

  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-2">What do you enjoy?</h2>
      <p className="text-slate-600 mb-2">
        We'll show you others who share these activities.
      </p>
      <p className="text-xs text-amber-600 font-semibold mb-8 uppercase tracking-wide">
        Tip: Your first choice is your primary activity.
      </p>

      <div className="grid grid-cols-1 gap-4 mb-12">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          const selectionIndex = selectedInterests.indexOf(interest);
          
          return (
            <button
              key={interest}
              onClick={() => onToggle(interest)}
              className={`text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-200'
              }`}>
                {isSelected ? (
                  <span className="text-white text-xs font-bold">
                    {selectionIndex === 0 ? '★' : '✓'}
                  </span>
                ) : null}
              </div>
              <div className="flex-1">
                <span className={`text-lg font-semibold ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}>
                  {interest}
                </span>
                {isSelected && selectionIndex === 0 && (
                  <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">Primary</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        disabled={!isAnythingSelected}
        onClick={onNext}
        className={`w-full py-5 rounded-2xl text-xl font-bold shadow-lg transition-all ${
          isAnythingSelected 
            ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Find my Buddy
      </button>
    </div>
  );
};
