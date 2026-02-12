import React, { useState } from 'react';

interface NamePickerProps {
  name: string;
  onSetName: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const NamePicker: React.FC<NamePickerProps> = ({ name, onSetName, onNext, onBack }) => {
  const [error, setError] = useState('');

  const handleNext = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name');
      return;
    }
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="flex flex-col h-full justify-center items-center px-6 pb-20 animate-fadeIn">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-6 drop-shadow-sm">👤</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">What should we call you?</h1>
          <p className="text-slate-500 text-lg font-medium">Your neighbors will see this name</p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                onSetName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              autoFocus
              maxLength={20}
              className={`w-full px-6 py-5 rounded-3xl text-xl font-bold border-2 transition-all placeholder-slate-300 focus:outline-none shadow-sm ${
                error
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-amber-300 bg-amber-50 text-slate-900 focus:border-amber-500 focus:bg-white'
              }`}
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {name.length}/20
            </span>
          </div>

          {error && (
            <p className="text-red-600 font-bold text-sm pl-4 animate-shake">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleNext}
            disabled={!name.trim()}
            className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-amber-950 disabled:text-slate-400 font-black rounded-3xl text-xl transition-all active:scale-95 shadow-lg"
          >
            Continue
          </button>
          <button
            onClick={onBack}
            className="w-full py-4 text-slate-500 font-bold rounded-2xl text-lg hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
