import React, { useState } from 'react';

interface NamePickerProps {
  onNext: (name: string) => void;
  onBack: () => void;
  initialName?: string;
}

export const NamePicker: React.FC<NamePickerProps> = ({ onNext, onBack, initialName = 'Buddy' }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  const handleNext = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name');
      return;
    }
    onNext(trimmed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="flex flex-col h-full justify-center items-center px-6 pb-20">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-4xl font-black text-slate-900">What should we call you?</h1>
          <p className="text-slate-500 text-lg">Your neighbors will see this name</p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              autoFocus
              maxLength={30}
              className={`w-full px-6 py-5 rounded-3xl text-xl font-bold border-2 transition-all placeholder-slate-300 focus:outline-none ${
                error
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-amber-300 bg-amber-50 text-slate-900 focus:border-amber-500'
              }`}
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {name.length}/30
            </span>
          </div>

          {error && <p className="text-red-600 font-semibold text-sm">{error}</p>}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleNext}
            disabled={!name.trim()}
            className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-amber-950 disabled:text-slate-400 font-black rounded-3xl text-xl transition-all active:scale-95 shadow-md"
          >
            Continue
          </button>
          <button
            onClick={onBack}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-lg"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
