import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Session, Invite, View, AreaId, Interest, InviteStatus } from '../types';
import { STORAGE_KEY, INVITE_DURATION_MS } from '../constants';

const initialState: AppState = {
  currentSession: null,
  invites: [],
  currentView: 'WELCOME',
};

// Anonymous Relay API (No Auth Key-Value Store for Demos)
const RELAY_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const APP_TOKEN = 'gb_v5_resilient_relay'; // New token for protocol improvements

/**
 * Transport Models to keep URL lengths minimal and avoid NetworkError (414)
 */
interface SessionTransport {
  i: string; // id
  n: string; // displayName
  a: AreaId; // areaId
  t: Interest[]; // interests
  s: number; // lastSeenAt
}

interface InviteTransport {
  i: string; // id
  f: string; // fromSessionId
  t: string; // toSessionId
  a: Interest; // activity
  s: InviteStatus; // status
  e: number; // expiresAt
}

const toTransportSession = (s: Session): SessionTransport => ({
  i: s.id, n: s.displayName, a: s.areaId, t: s.interests, s: s.lastSeenAt
});

const fromTransportSession = (t: SessionTransport): Session => ({
  id: t.i, displayName: t.n, areaId: t.a, interests: t.t, createdAt: Date.now(), lastSeenAt: t.s
});

const toTransportInvite = (i: Invite): InviteTransport => ({
  i: i.id, f: i.fromSessionId, t: i.toSessionId, a: i.activity, s: i.status, e: i.expiresAt
});

const fromTransportInvite = (t: InviteTransport): Invite => ({
  id: t.i, fromSessionId: t.f, toSessionId: t.t, activity: t.a, status: t.s, createdAt: Date.now(), expiresAt: t.e
});

export function useGoldenBuddyStore() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        const merged: AppState = { ...initialState, ...parsed } as AppState;

        // If a previous debug view was saved, don't auto-open it on load.
        // Prefer dashboard if session exists, otherwise show welcome.
        if ((merged as any).currentView === 'DIAGNOSTICS') {
          merged.currentView = merged.currentSession ? 'DASHBOARD' : 'WELCOME';
        }

        // Only keep invites relevant to the current session and not expired
        if (!merged.currentSession) {
          merged.invites = [];
        } else {
          const now = Date.now();
          merged.invites = (merged.invites || []).filter(i => (
            (i.fromSessionId === merged.currentSession!.id || i.toSessionId === merged.currentSession!.id)
            && i.expiresAt > now
          ));
        }

        return merged;
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  const [remotePeers, setRemotePeers] = useState<Session[]>([]);
  const isSyncing = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const safeParseArray = <T>(jsonString: string | null): T[] => {
    if (!jsonString || jsonString === "null" || jsonString === "[]") return [];
    try {
      const sanitized = jsonString.startsWith('"') && jsonString.endsWith('"') 
        ? JSON.parse(jsonString) 
        : jsonString;
      const parsed = typeof sanitized === 'string' ? JSON.parse(sanitized) : sanitized;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      } catch (e) {
        clearTimeout(id);
        if (i === retries) throw e;
        await new Promise(r => setTimeout(r, 500 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error("Max retries reached");
  };

  const broadcastPresence = useCallback(async () => {
    if (!state.currentSession) return;
    try {
      const sessionData = toTransportSession({ ...state.currentSession, lastSeenAt: Date.now() });
      const sessionJson = JSON.stringify(sessionData);
      await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/s_${state.currentSession.id}/${encodeURIComponent(sessionJson)}`, { method: 'POST' });
      
      const dirRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/d_${state.currentSession.areaId}`);
      const dirRaw = await dirRes.text();
      let directory = safeParseArray<string>(dirRaw);
      
      if (!directory.includes(state.currentSession.id)) {
        directory = [...directory, state.currentSession.id].slice(-10);
        await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/d_${state.currentSession.areaId}/${encodeURIComponent(JSON.stringify(directory))}`, { method: 'POST' });
      }
    } catch (e) { /* Silently retry */ }
  }, [state.currentSession]);

  const syncRemoteData = useCallback(async () => {
    if (!state.currentSession || isSyncing.current) return;
    isSyncing.current = true;

    try {
      const dirRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/d_${state.currentSession.areaId}`);
      const dirRaw = await dirRes.text();
      const ids = safeParseArray<string>(dirRaw);

      const peerPromises = ids
        .filter(id => id !== state.currentSession?.id)
        .slice(-5) 
        .map(async (id) => {
          try {
            const res = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/s_${id}`);
            const raw = await res.text();
            if (!raw || raw === "null") return null;
            const data = raw.startsWith('"') ? JSON.parse(raw) : raw;
            return fromTransportSession(JSON.parse(data));
          } catch(e) { return null; }
        });
      
      const peers = (await Promise.all(peerPromises)).filter(p => p && (Date.now() - p.lastSeenAt < 300000)) as Session[];
      setRemotePeers(peers);

      const invRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/i_${state.currentSession.id}`);
      const invRaw = await invRes.text();
      const transportInvites = safeParseArray<InviteTransport>(invRaw);
      const remoteInvites = transportInvites.map(fromTransportInvite);

      if (remoteInvites.length > 0) {
        setState(prev => {
          const existingIds = new Set(prev.invites.map(i => i.id));
          const newInvites = remoteInvites.filter(ri => !existingIds.has(ri.id));
          if (newInvites.length === 0) return prev;
          return { ...prev, invites: [...prev.invites, ...newInvites] };
        });
      }

      const outgoing = state.invites.filter(i => i.fromSessionId === state.currentSession?.id && i.status === 'PENDING');
      for (const inv of outgoing) {
        try {
          const checkRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/v_${inv.id}`);
          let statusRaw = await checkRes.text();
          statusRaw = statusRaw.replace(/"/g, '').trim();
          
          if (statusRaw === 'ACCEPTED' || statusRaw === 'DECLINED') {
            setState(prev => ({
              ...prev,
              invites: prev.invites.map(i => i.id === inv.id ? { ...i, status: statusRaw as InviteStatus, respondedAt: Date.now() } : i)
            }));
          }
        } catch(e) {}
      }
    } catch (e) { /* Silently retry */ } finally {
      isSyncing.current = false;
    }
  }, [state.currentSession, state.invites]);

  useEffect(() => {
    if (!state.currentSession) return;
    broadcastPresence();
    const pInt = setInterval(broadcastPresence, 30000); 
    const sInt = setInterval(syncRemoteData, 8000); 
    return () => { clearInterval(pInt); clearInterval(sInt); };
  }, [state.currentSession, broadcastPresence, syncRemoteData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setState(prev => {
        let changed = false;
        const newInvites = prev.invites.map(invite => {
          if (invite.status === 'PENDING' && now > invite.expiresAt) {
            changed = true;
            return { ...invite, status: 'EXPIRED' as InviteStatus };
          }
          return invite;
        });
        return changed ? { ...prev, invites: newInvites } : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const setView = (view: View) => setState(prev => ({ ...prev, currentView: view }));

  const createSession = useCallback((name: string, areaId: AreaId, interests: Interest[]) => {
    const newSession: Session = {
      id: Math.random().toString(36).substr(2, 6),
      displayName: name,
      areaId,
      interests,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    setState(prev => ({ ...prev, currentSession: newSession, currentView: 'DASHBOARD' }));
  }, []);

  const sendInvite = useCallback(async (toId: string, activity: Interest) => {
    if (!state.currentSession) return;
    
    // Prevent duplicate sending locally
    const isAlreadySent = state.invites.some(i => i.toSessionId === toId && i.fromSessionId === state.currentSession?.id && i.status === 'PENDING');
    if (isAlreadySent) return;

    const newInvite: Invite = {
      id: Math.random().toString(36).substr(2, 6),
      fromSessionId: state.currentSession.id,
      toSessionId: toId,
      activity,
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_DURATION_MS,
    };

    setState(prev => ({ ...prev, invites: [...prev.invites, newInvite] }));

    try {
      const inboxRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/i_${toId}`);
      const inboxRaw = await inboxRes.text();
      let inbox = safeParseArray<InviteTransport>(inboxRaw);
      // Keep recipient inbox very small to avoid long URLs
      inbox = [...inbox, toTransportInvite(newInvite)].slice(-2);
      await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/i_${toId}/${encodeURIComponent(JSON.stringify(inbox))}`, { method: 'POST' });
      // remote inbox updated
      // If we're sending to a mock peer (demo), simulate a response after a short delay
      try {
        if (toId.startsWith('peer_')) {
          const delay = Math.floor(Math.random() * 5000) + 3000; // 3-8s
          const willAccept = Math.random() < 0.8; // ~80% chance to accept
          setTimeout(async () => {
            // Update local state so UI reflects the simulated response immediately
            setState(prev => ({
              ...prev,
              invites: prev.invites.map(i => i.id === newInvite.id ? { ...i, status: willAccept ? 'ACCEPTED' : 'DECLINED', respondedAt: Date.now() } : i)
            }));
            // Also write back to relay so other peers would see the response
            try {
              await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/v_${newInvite.id}/${willAccept ? 'ACCEPTED' : 'DECLINED'}`, { method: 'POST' });
            } catch (e) { /* ignore relay write errors for simulation */ }
          }, delay);
        }
      } catch (e) { /* ignore simulation errors */ }
    } catch (e) { 
      console.warn("Remote invite send failed, local state only.", e);
    }
  }, [state.currentSession, state.invites]);

  const respondToInvite = useCallback(async (inviteId: string, action: 'ACCEPTED' | 'DECLINED') => {
    setState(prev => ({
      ...prev,
      invites: prev.invites.map(inv => inv.id === inviteId ? { ...inv, status: action, respondedAt: Date.now() } : inv)
    }));

    try {
      await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/v_${inviteId}/${action}`, { method: 'POST' });
      if (state.currentSession) {
        const inboxRes = await fetchWithTimeout(`${RELAY_BASE}/GetValue/${APP_TOKEN}/i_${state.currentSession.id}`);
        const inboxRaw = await inboxRes.text();
        const inbox = safeParseArray<InviteTransport>(inboxRaw);
        const filtered = inbox.filter(i => i.i !== inviteId);
        await fetchWithTimeout(`${RELAY_BASE}/UpdateValue/${APP_TOKEN}/i_${state.currentSession.id}/${encodeURIComponent(JSON.stringify(filtered))}`, { method: 'POST' });
      }
    } catch (e) { /* Local state persists */ }
  }, [state.currentSession]);

  const resetApp = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setRemotePeers([]);
  }, []);

  return { state, remotePeers, setView, createSession, sendInvite, respondToInvite, resetApp };
}
