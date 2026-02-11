export type AreaId = 'arlington_va' | 'alexandria_va' | 'richmond_va' | 'exploring';

export interface Area {
  id: AreaId;
  name: string;
  label: string;
}

export type Interest = 'Walking' | 'Chess' | 'Coffee & Chat' | 'Bird Watching' | 'Gardening';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Session {
  id: string;
  displayName: string;
  areaId: AreaId;
  interests: Interest[];
  createdAt: number;
  lastSeenAt: number;
}

export interface Invite {
  id: string;
  fromSessionId: string;
  toSessionId: string;
  activity: Interest;
  status: InviteStatus;
  createdAt: number;
  expiresAt: number;
  respondedAt?: number;
}

export type View = 'WELCOME' | 'LOCATION' | 'INTERESTS' | 'DASHBOARD' | 'PROFILE';

export interface AppState {
  currentSession: Session | null;
  invites: Invite[];
  currentView: View;
}