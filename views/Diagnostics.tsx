import React, { useState } from 'react';
import { useGoldenBuddyStore } from '../services/store';

const RELAY_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const APP_TOKEN = 'gb_v5_resilient_relay';

export const Diagnostics: React.FC = () => {
  const { state } = useGoldenBuddyStore() as any;
  const [key, setKey] = useState('');
  const [raw, setRaw] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKey = async (k: string) => {
    setLoading(true); setError(null); setRaw(null); setParsed(null);
    try {
      const res = await fetch(`${RELAY_BASE}/GetValue/${APP_TOKEN}/${encodeURIComponent(k)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setRaw(text);
      try { setParsed(JSON.parse(text.startsWith('"') ? JSON.parse(text) : text)); } catch (e) { setParsed(null); }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Diagnostics</h2>
      <p className="text-sm text-slate-500 mb-4">Use this page to inspect relay values for debugging invites and inboxes.</p>

      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="Enter key (e.g. v_abcd12 or i_sessionId)" className="flex-1 p-2 rounded border" />
          <button onClick={() => fetchKey(key)} className="px-3 py-2 bg-amber-500 text-amber-950 rounded">Fetch</button>
        </div>
        <div className="text-xs text-slate-500">Quick keys:
          <button onClick={() => setKey(state.currentSession?.id ? `i_${state.currentSession.id}` : '')} className="ml-2 underline">Inbox</button>
          <button onClick={() => { const inv = state.invites[0]; setKey(inv ? `v_${inv.id}` : ''); }} className="ml-2 underline">Most recent invite status</button>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-600">Loading…</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
      {raw !== null && (
        <div className="mt-4">
          <h4 className="font-bold">Raw Value</h4>
          <pre className="p-3 bg-slate-100 rounded text-sm overflow-auto">{raw}</pre>
          <h4 className="font-bold mt-3">Parsed</h4>
          <pre className="p-3 bg-slate-50 rounded text-sm overflow-auto">{parsed ? JSON.stringify(parsed, null, 2) : 'Not JSON / could not parse'}</pre>
        </div>
      )}
    </div>
  );
};

export default Diagnostics;
