
import { Area, Interest } from './types';

export const AREAS: Area[] = [
  { id: 'arlington_va', name: 'Arlington County', label: 'Arlington County' },
  { id: 'alexandria_va', name: 'City of Alexandria', label: 'City of Alexandria' },
  { id: 'richmond_va', name: 'City of Richmond', label: 'City of Richmond' },
  { id: 'exploring', name: 'Just exploring', label: 'Just exploring' },
];

export const INTERESTS: Interest[] = [
  'Walking',
  'Chess',
  'Coffee & Chat',
  'Bird Watching',
  'Gardening',
];

export const INVITE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const STORAGE_KEY = 'goldenbuddy_v1_state';

// Mock peers for the demo
export const MOCK_PEERS = [
  { id: 'peer_1', displayName: 'Martha', areaId: 'arlington_va', interests: ['Walking', 'Gardening'], distance: '5-10 min walk', buddySince: 'Oct 2023', lastSeen: '2 hours ago' },
  { id: 'peer_2', displayName: 'Harold', areaId: 'arlington_va', interests: ['Chess', 'Walking'], distance: '15 min walk', buddySince: 'Jan 2024', lastSeen: 'Active today' },
  { id: 'peer_3', displayName: 'Elena', areaId: 'alexandria_va', interests: ['Walking', 'Bird Watching'], distance: 'Nearby area', buddySince: 'Nov 2023', lastSeen: 'Active recently' },
  { id: 'peer_4', displayName: 'Sam', areaId: 'richmond_va', interests: ['Coffee & Chat'], distance: 'City of Richmond', buddySince: 'Dec 2023', lastSeen: '3 days ago' },
  { id: 'peer_5', displayName: 'George', areaId: 'richmond_va', interests: ['Gardening', 'Coffee & Chat'], distance: '10 min walk', buddySince: 'Sep 2023', lastSeen: 'Active today' },
  { id: 'peer_6', displayName: 'Linda', areaId: 'arlington_va', interests: ['Bird Watching', 'Walking'], distance: '8 min walk', buddySince: 'Feb 2024', lastSeen: 'Active recently' },
  { id: 'peer_7', displayName: 'Robert', areaId: 'alexandria_va', interests: ['Chess', 'Coffee & Chat'], distance: '20 min walk', buddySince: 'Aug 2023', lastSeen: '1 day ago' },
  { id: 'peer_8', displayName: 'Susan', areaId: 'exploring', interests: ['Walking', 'Bird Watching'], distance: 'Exploring nearby', buddySince: 'Jan 2024', lastSeen: '5 hours ago' },
  { id: 'peer_9', displayName: 'Arthur', areaId: 'arlington_va', interests: ['Chess', 'Gardening'], distance: '12 min walk', buddySince: 'Oct 2023', lastSeen: 'Active today' },
  { id: 'peer_10', displayName: 'Patricia', areaId: 'richmond_va', interests: ['Walking', 'Coffee & Chat'], distance: '5 min walk', buddySince: 'Nov 2023', lastSeen: '2 hours ago' },
  { id: 'peer_11', displayName: 'David', areaId: 'alexandria_va', interests: ['Bird Watching', 'Gardening'], distance: '15 min walk', buddySince: 'Dec 2023', lastSeen: 'Active recently' },
  { id: 'peer_12', displayName: 'Dorothy', areaId: 'arlington_va', interests: ['Walking', 'Coffee & Chat'], distance: '25 min walk', buddySince: 'Sep 2023', lastSeen: '4 days ago' },
  { id: 'peer_13', displayName: 'Richard', areaId: 'richmond_va', interests: ['Chess', 'Bird Watching'], distance: '18 min walk', buddySince: 'Aug 2023', lastSeen: 'Active today' },
  { id: 'peer_14', displayName: 'Margaret', areaId: 'exploring', interests: ['Gardening', 'Coffee & Chat'], distance: 'Exploring nearby', buddySince: 'Feb 2024', lastSeen: 'Active recently' },
  { id: 'peer_15', displayName: 'Nancy', areaId: 'alexandria_va', interests: ['Bird Watching', 'Gardening'], distance: '10 min walk', buddySince: 'Jul 2023', lastSeen: 'Just now' },
  { id: 'peer_16', displayName: 'Walter', areaId: 'richmond_va', interests: ['Chess', 'Coffee & Chat'], distance: '12 min walk', buddySince: 'May 2023', lastSeen: '6 hours ago' },
  { id: 'peer_17', displayName: 'Barbara', areaId: 'arlington_va', interests: ['Walking', 'Bird Watching'], distance: '3 min walk', buddySince: 'Mar 2024', lastSeen: 'Active today' },
  { id: 'peer_18', displayName: 'Charles', areaId: 'exploring', interests: ['Walking', 'Gardening'], distance: 'Nearby area', buddySince: 'Jan 2023', lastSeen: 'Yesterday' },
  { id: 'peer_19', displayName: 'Alice', areaId: 'alexandria_va', interests: ['Coffee & Chat', 'Walking'], distance: '5 min walk', buddySince: 'Jun 2023', lastSeen: 'Active today' },
  { id: 'peer_20', displayName: 'Thomas', areaId: 'richmond_va', interests: ['Chess', 'Bird Watching'], distance: '25 min walk', buddySince: 'Apr 2023', lastSeen: '2 days ago' },
  { id: 'peer_21', displayName: 'Helen', areaId: 'arlington_va', interests: ['Gardening', 'Coffee & Chat'], distance: '15 min walk', buddySince: 'Sep 2022', lastSeen: 'Active recently' },
  { id: 'peer_22', displayName: 'Frank', areaId: 'exploring', interests: ['Bird Watching', 'Walking'], distance: '10 min walk', buddySince: 'Aug 2022', lastSeen: '4 hours ago' },
  { id: 'peer_23', displayName: 'Betty', areaId: 'richmond_va', interests: ['Walking', 'Chess'], distance: '7 min walk', buddySince: 'Feb 2023', lastSeen: 'Just now' },
  { id: 'peer_24', displayName: 'Edward', areaId: 'alexandria_va', interests: ['Gardening', 'Chess'], distance: '20 min walk', buddySince: 'Dec 2022', lastSeen: 'Active today' },
  { id: 'peer_25', displayName: 'Lawrence', areaId: 'richmond_va', interests: ['Gardening', 'Walking'], distance: '12 min walk', buddySince: 'Nov 2022', lastSeen: 'Active today' },
  { id: 'peer_26', displayName: 'Virginia', areaId: 'alexandria_va', interests: ['Coffee & Chat', 'Bird Watching'], distance: '8 min walk', buddySince: 'Jan 2023', lastSeen: '3 hours ago' },
  { id: 'peer_27', displayName: 'Stanley', areaId: 'arlington_va', interests: ['Walking', 'Chess'], distance: '5 min walk', buddySince: 'Oct 2023', lastSeen: 'Just now' },
  { id: 'peer_28', displayName: 'Irene', areaId: 'exploring', interests: ['Bird Watching', 'Coffee & Chat'], distance: 'Nearby area', buddySince: 'Mar 2023', lastSeen: 'Active recently' },
  { id: 'peer_29', displayName: 'Eugene', areaId: 'richmond_va', interests: ['Chess', 'Gardening'], distance: '15 min walk', buddySince: 'May 2022', lastSeen: 'Yesterday' },
  { id: 'peer_30', displayName: 'Florence', areaId: 'alexandria_va', interests: ['Walking', 'Gardening'], distance: '10 min walk', buddySince: 'Jul 2023', lastSeen: 'Active today' },
  { id: 'peer_31', displayName: 'Raymond', areaId: 'arlington_va', interests: ['Coffee & Chat', 'Walking'], distance: '18 min walk', buddySince: 'Sep 2023', lastSeen: '2 days ago' },
  { id: 'peer_32', displayName: 'Beatrice', areaId: 'exploring', interests: ['Chess', 'Bird Watching'], distance: 'Nearby area', buddySince: 'Aug 2023', lastSeen: 'Active recently' },
  { id: 'peer_33', displayName: 'Albert', areaId: 'richmond_va', interests: ['Bird Watching', 'Chess'], distance: '22 min walk', buddySince: 'Jun 2022', lastSeen: '4 hours ago' },
  { id: 'peer_34', displayName: 'Louise', areaId: 'alexandria_va', interests: ['Gardening', 'Coffee & Chat'], distance: '6 min walk', buddySince: 'Nov 2023', lastSeen: 'Just now' },
];
