
import React from 'react';
import { AREAS } from '../constants';
import { AreaId } from '../types';

interface LocationPickerProps {
  selectedArea: AreaId | null;
  onSelect: (id: AreaId) => void;
  onBack: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onSelect, onBack }) => {
  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-6 text-slate-500 font-semibold flex items-center gap-1">
        ← Back
      </button>
      
      <h2 className="text-2xl font-bold mb-2">Where do you walk?</h2>
      <p className="text-slate-600 mb-8">
        This helps us suggest partners nearby. Your exact location is never tracked.
      </p>

      <div className="space-y-4">
        {AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => onSelect(area.id)}
            className="w-full text-left p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all flex justify-between items-center group"
          >
            <div>
              <span className="text-xl font-bold text-slate-800">{area.name}</span>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </button>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
        <span className="text-2xl">🔒</span>
        <p className="text-sm text-blue-800">
          <strong>Privacy Note:</strong> We only use this area to show you neighbors. We never access your phone's GPS.
        </p>
      </div>
    </div>
  );
};
