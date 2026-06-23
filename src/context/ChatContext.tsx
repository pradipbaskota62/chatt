import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  addDoc
} from "firebase/firestore";
import { auth, db, handleFirestoreError } from "../firebase";
import { UserProfile, Channel, OperationType, LocalNotificationSetting, InAppNotification } from "../types";
import { playMessagePing, playSuccessChime, playToggleClick } from "../utils/audio";

interface ChatContextType {
  user: User | null;
  currentUserProfile: UserProfile | null;
  channels: Channel[];
  users: UserProfile[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
  loading: boolean;
  notificationSetting: LocalNotificationSetting;
  inAppNotifications: InAppNotification[];
  setActiveChannelId: (id: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  logOutAndClean: () => Promise<void>;
  updateProfile: (displayName: string, photoURL: string) => Promise<void>;
  updatePresence: (status: "online" | "offline" | "away") => Promise<void>;
  createChannel: (name: string, description: string, type: "public" | "direct", invitees?: string[]) => Promise<string | null>;
  setNotificationSetting: React.Dispatch<React.SetStateAction<LocalNotificationSetting>>;
  triggerNotification: (title: string, body: string, roomId?: string, avatar?: string) => void;
  dismissNotification: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  
  const [notificationSetting, setNotificationSetting] = useState<LocalNotificationSetting>({
    soundEnabled: true,
    bannerEnabled: true,
    systemEnabled: false
  });

  // Load notification preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chat_notification_settings");
    if (saved) {
      try {
        setNotificationSetting(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save notification preferences
  useEffect(() => {
    localStorage.setItem("chat_notification_settings", JSON.stringify(notificationSetting));
  }, [notificationSetting]);

  // Request browser Notification API permission if system enabled
  useEffect(() => {
    if (notificationSetting.systemEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission !== "granted") {
            setNotificationSetting(prev => ({ ...prev, systemEnabled: false }));
          }
        });
      }
    }
  }, [notificationSetting.systemEnabled]);

  // Triggering native or banner notifications
  const triggerNotification = (title: string, body: string, roomId?: string, avatar?: string) => {
    // 1. Play synthesized ping sound
    if (notificationSetting.soundEnabled) {
      playMessagePing();
    }

    // 2. Browser native desktop notifications
    if (notificationSetting.systemEnabled && "Notification" in window && Notification.permission === "granted") {
      try {
        const option = {
          body,
          icon: avatar || "/favicon.ico",
          tag: roomId || "general-chat"
        };
        new Notification(title, option);
      } catch (e) {
        console.warn("Native Notification failed inside frame:", e);
      }
    }

    // 3. In-app floating custom banner
    if (notificationSetting.bannerEnabled) {
      const newNotification: InAppNotification = {
        id: Math.random().toString(36).substring(2),
        title,
        body,
        avatar,
        roomId,
        timestamp: new Date()
      };
      setInAppNotifications(prev => [newNotification, ...prev].slice(0, 5));
      
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, 6000);
    }
  };

  const dismissNotification = (id: string) => {
    setInAppNotifications(prev => prev.filter(n => n.id !== id));
  };

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

  // Handle Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Build Profile doc
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const snapshot = await getDoc(userRef);
          
          let profileData: UserProfile;
          if (!snapshot.exists()) {
            profileData = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || `Stellar User #${Math.floor(100+Math.random()*900)}`,
              email: currentUser.email || "",
              photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
              status: "online",
              lastSeen: serverTimestamp()
            };
            await setDoc(userRef, profileData);
          } else {
            profileData = snapshot.data() as UserProfile;
            // Always set online status on login
            await setDoc(userRef, {
              status: "online",
              lastSeen: serverTimestamp()
            }, { merge: true });
          }
          
          playSuccessChime();
        } catch (error) {
          console.error("Failed creating user profile: ", error);
        }
      } else {
        setCurrentUserProfile(null);
        setActiveChannelId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync current user's full profile document
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUserProfile(snapshot.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `/users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  // Keep lastSeen active on tick
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const userRef = doc(db, "users", user.uid);
      setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true }).catch(err => {
        console.error("Keep-alive presence write failed", err);
      });
    }, 45000); // every 45 secs

    return () => clearInterval(interval);
  }, [user]);

  // Listen to Users list
  useEffect(() => {
    if (!user) return;

    const usersQuery = query(collection(db, "users"), orderBy("displayName", "asc"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      });
      setUsers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Channels (Public and DMs where current user is a member)
  useEffect(() => {
    if (!user) {
      setChannels([]);
      return;
    }

    const channelsQuery = query(collection(db, "channels"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(channelsQuery, (snapshot) => {
      const list: Channel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Channel;
        // Check if public or if user is in memberIds
        if (data.type === "public" || data.memberIds.includes(user.uid)) {
          list.push(data);
        }
      });
      setChannels(list);
      
      // Auto-select first channel if none active
      if (list.length > 0 && !activeChannelId) {
        // Try selecting public general room first
        const general = list.find(c => c.name.toLowerCase() === "general");
        setActiveChannelId(general ? general.id : list[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "channels");
    });

    return () => unsubscribe();
  }, [user, activeChannelId]);

  // Sign In with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Authenticate PopUp failed:", error);
      throw error;
    }
  };

  // Log out Presence & session
  const logOutAndClean = async () => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          status: "offline",
          lastSeen: serverTimestamp()
        }, { merge: true });
      }
      playToggleClick(false);
      await signOut(auth);
    } catch (error) {
      console.error("SignOut failed:", error);
    }
  };

  // Update Profile
  const updateProfile = async (displayName: string, photoURL: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await setDoc(userRef, {
        displayName,
        photoURL,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `/users/${user.uid}`);
    }
  };

  // Update Presence Status manually
  const updatePresence = async (status: "online" | "offline" | "away") => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await setDoc(userRef, {
        status,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `/users/${user.uid}`);
    }
  };

  // Create Channel / Direct message
  const createChannel = async (name: string, description: string, type: "public" | "direct", invitees: string[] = []): Promise<string | null> => {
    if (!user) return null;
    try {
      const channelRef = doc(collection(db, "channels"));
      const isDirect = type === "direct";
      
      const memberIds = isDirect 
        ? Array.from(new Set([user.uid, ...invitees]))
        : [user.uid];

      const newChannel: Channel = {
        id: channelRef.id,
        name: isDirect ? `dm-${memberIds.join("-")}` : name,
        description: isDirect ? "Direct messaging conversation thread." : description,
        type,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        memberIds
      };

      await setDoc(channelRef, newChannel);
      setActiveChannelId(channelRef.id);
      return channelRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "channels");
      return null;
    }
  };

  return (
    <ChatContext.Provider value={{
      user,
      currentUserProfile,
      channels,
      users,
      activeChannelId,
      activeChannel,
      loading,
      notificationSetting,
      inAppNotifications,
      setActiveChannelId,
      signInWithGoogle,
      logOutAndClean,
      updateProfile,
      updatePresence,
      createChannel,
      setNotificationSetting,
      triggerNotification,
      dismissNotification
    }}>
      {children}
    </ChatContext.Provider>
  );
};
