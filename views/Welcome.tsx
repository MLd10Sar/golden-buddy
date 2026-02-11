
import React from 'react';

interface WelcomeProps {
  onNext: () => void;
}

export const WelcomeView: React.FC<WelcomeProps> = ({ onNext }) => {
  return (
    <div className="p-8 flex flex-col items-center text-center animate-fadeIn">
      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner">
        👋
      </div>
      <h2 className="text-3xl font-bold mb-4 text-slate-800">Hello there!</h2>
      <p className="text-xl text-slate-600 mb-8 leading-relaxed">
        Find a walking partner nearby. <br/>
        <span className="font-semibold text-amber-600">No sign-up. No tracking.</span>
      </p>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-10 w-full text-left">
        <h3 className="font-semibold mb-3 text-slate-700 uppercase tracking-wider text-xs">How it works</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="bg-amber-400 text-amber-950 rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">1</span>
            <p className="text-slate-600">Select your general neighborhood.</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-amber-400 text-amber-950 rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">2</span>
            <p className="text-slate-600">Pick what you like to do (Walk, Chess, etc).</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-amber-400 text-amber-950 rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold text-sm">3</span>
            <p className="text-slate-600">Say hello to someone nearby.</p>
          </li>
        </ul>
      </div>

      <button 
        onClick={onNext}
        className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold py-5 rounded-2xl text-xl shadow-lg transition-transform active:scale-95"
      >
        Get Started
      </button>

      <p className="mt-8 text-sm text-slate-400">
        Built for simple, safe connections.
      </p>
    </div>
  );
};
