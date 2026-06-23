export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  status: "online" | "offline" | "away";
  lastSeen: any; // Can be Timestamp or firestore representation
  pushToken?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: "public" | "direct";
  createdAt: any;
  createdBy: string;
  memberIds: string[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface LocalNotificationSetting {
  soundEnabled: boolean;
  bannerEnabled: boolean;
  systemEnabled: boolean;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  avatar?: string;
  roomId?: string;
  timestamp: Date;
}
