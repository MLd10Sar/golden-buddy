import React, { useState } from 'react';
import { useGoldenBuddyStore } from './services/store';
import { WelcomeView } from './views/Welcome';
import { LocationPicker } from './views/LocationPicker';
import { InterestPicker } from './views/InterestPicker';
import { Dashboard } from './views/Dashboard';
import { ProfileView } from './views/Profile';
import { AreaId, Interest } from './types';

const App: React.FC = () => {
  const { state, remotePeers, setView, createSession, sendInvite, respondToInvite, resetApp } = useGoldenBuddyStore();
  
  // Local temporary state for onboarding flow
  const [tempName, setTempName] = useState('Buddy');
  const [tempArea, setTempArea] = useState<AreaId | null>(null);
  const [tempInterests, setTempInterests] = useState<Interest[]>([]);

  const handleFinishOnboarding = () => {
    if (tempArea) {
      createSession(tempName, tempArea, tempInterests);
    }
  };

  const renderView = () => {
    switch (state.currentView) {
      case 'WELCOME':
        return <WelcomeView onNext={() => setView('LOCATION')} />;
      
      case 'LOCATION':
        return (
          <LocationPicker 
            selectedArea={tempArea} 
            onSelect={(area) => {
              setTempArea(area);
              setView('INTERESTS');
            }}
            onBack={() => setView('WELCOME')}
          />
        );
      
      case 'INTERESTS':
        return (
          <InterestPicker 
            selectedInterests={tempInterests}
            onToggle={(interest) => {
              setTempInterests(prev => 
                prev.includes(interest) 
                  ? prev.filter(i => i !== interest) 
                  : [...prev, interest]
              );
            }}
            onNext={handleFinishOnboarding}
            onBack={() => setView('LOCATION')}
          />
        );
      
      case 'DASHBOARD':
        return (
          <Dashboard 
            session={state.currentSession!} 
            invites={state.invites}
            remotePeers={remotePeers}
            onSendInvite={sendInvite}
            onRespond={respondToInvite}
            onReset={resetApp}
          />
        );

      case 'PROFILE':
        return (
          <ProfileView 
            session={state.currentSession!}
            onBack={() => setView('DASHBOARD')}
            onEditInterests={() => setView('INTERESTS')}
            onReset={resetApp}
          />
        );
      
      default:
        return <WelcomeView onNext={() => setView('LOCATION')} />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl flex flex-col relative overflow-hidden">
      {/* App Header */}
      <header className="p-4 border-b bg-amber-400 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
          <span className="text-2xl" role="img" aria-label="Golden Buddy Logo">🌟</span>
          <h1 className="font-bold text-xl tracking-tight text-amber-950">GoldenBuddy</h1>
        </div>
        {state.currentSession && (
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold text-amber-900 bg-white/40 px-2 py-0.5 rounded-full mb-1">LIVE</span>
             <button 
                onClick={() => setView('PROFILE')}
                className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm transition-colors ${
                  state.currentView === 'PROFILE' ? 'bg-amber-950 text-white' : 'bg-white text-amber-900'
                }`}
              >
                My Info
              </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50">
        {renderView()}
      </main>

      {/* Persistence indicator for demo */}
      <div className="bg-slate-900 text-slate-400 text-[10px] text-center py-1">
        Privacy First • Relay Networking Enabled • No Tracking
      </div>
    </div>
  );
};

export default App;