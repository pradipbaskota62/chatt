import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import { 
  Hash, 
  MessageCircle, 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Users, 
  ChevronRight, 
  Volume2, 
  BellRing,
  Globe,
  Radio,
  UserPlus
} from "lucide-react";
import { playToggleClick, playSuccessChime } from "../utils/audio";

interface SidebarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export default function Sidebar({ onOpenProfile, onOpenNotifications }: SidebarProps) {
  const { 
    user, 
    currentUserProfile, 
    channels, 
    users, 
    activeChannelId, 
    setActiveChannelId, 
    createChannel, 
    logOutAndClean,
    notificationSetting
  } = useChat();

  const [channelSearch, setChannelSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChanName, setNewChanName] = useState("");
  const [newChanDesc, setNewChanDesc] = useState("");
  const [newChanType, setNewChanType] = useState<"public" | "direct">("public");
  const [isCreating, setIsCreating] = useState(false);

  // Filter channels
  const publicChannels = channels.filter(
    (c) => c.type === "public" && c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const directRooms = channels.filter(
    (c) => c.type === "direct"
  );

  // Filter users lists (excluding self)
  const otherUsers = users.filter(
    (u) => u.uid !== user?.uid && u.displayName.toLowerCase().includes(usersSearch.toLowerCase())
  );

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanName.trim() && newChanType === "public") return;
    setIsCreating(true);
    try {
      playSuccessChime();
      const sanitizedName = newChanName.trim().toLowerCase().replace(/\s+/g, "-");
      const desc = newChanDesc.trim() || `Discussion about ${newChanName}`;
      await createChannel(sanitizedName, desc, "public");
      setNewChanName("");
      setNewChanDesc("");
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Start or open dynamic Direct Message between current user and selection
  const handleStartDM = async (targetUser: any) => {
    if (!user) return;
    
    // Check if DM channel with this user already exists
    const existingDM = directRooms.find(
      (c) => c.memberIds.includes(user.uid) && c.memberIds.includes(targetUser.uid)
    );

    if (existingDM) {
      setActiveChannelId(existingDM.id);
    } else {
      // Create new DM
      playSuccessChime();
      await createChannel("", "", "direct", [targetUser.uid]);
    }
  };

  // Helper to obtain DM Display Name
  const getDMName = (chan: any) => {
    const peerId = chan.memberIds.find((id: string) => id !== user?.uid);
    const peerProfile = users.find((u) => u.uid === peerId);
    return peerProfile ? peerProfile.displayName : "Active Chat";
  };

  // Helper to obtain DM Avatar
  const getDMAvatar = (chan: any) => {
    const peerId = chan.memberIds.find((id: string) => id !== user?.uid);
    const peerProfile = users.find((u) => u.uid === peerId);
    return peerProfile ? peerProfile.photoURL : "https://api.dicebear.com/7.x/bottts/svg?seed=Peer";
  };

  // Helper to obtain DM Status
  const getDMStatus = (chan: any) => {
    const peerId = chan.memberIds.find((id: string) => id !== user?.uid);
    const peerProfile = users.find((u) => u.uid === peerId);
    return peerProfile ? peerProfile.status : "offline";
  };

  return (
    <div 
      id="chat-sidebar" 
      className="w-[245px] border-r border-slate-800 bg-slate-900 flex flex-col h-full overflow-hidden select-none shrink-0"
    >
      {/* Sidebar Header containing Current User info and quick modals */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shadow-sm shrink-0">
        <div className="flex items-center gap-2 mr-1 min-w-0">
          <div className="relative cursor-pointer group shrink-0" onClick={onOpenProfile}>
            <img 
              src={currentUserProfile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700 transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
              currentUserProfile?.status === "online" ? "bg-emerald-500" :
              currentUserProfile?.status === "away" ? "bg-amber-505" : "bg-slate-600"
            }`}></span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-0.5">
              Profile
            </span>
            <span className="text-xs font-bold text-slate-200 truncate">
              {currentUserProfile?.displayName || user?.displayName || "Stellar Resident"}
            </span>
          </div>
        </div>

        {/* Top Control Bar buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button 
            type="button"
            title="Notification Hub"
            onClick={onOpenNotifications}
            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors relative"
          >
            <BellRing className="w-3.5 h-3.5" />
            {(notificationSetting.soundEnabled || notificationSetting.bannerEnabled) && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            )}
          </button>
          <button 
            type="button"
            title="Log Out Session"
            onClick={logOutAndClean}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-850 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        
        {/* SECTION 1: PUBLIC ROOM CHANNELS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1.5">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> Rooms ({publicChannels.length})
            </span>
            <button 
              onClick={() => {
                playToggleClick(true);
                setShowCreateModal(true);
              }}
              className="p-0.5 rounded bg-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-750 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Channels Search Box */}
          <div className="relative px-1.5">
            <input
              type="text"
              placeholder="Filter rooms..."
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              className="w-full text-[11px] bg-slate-950 border border-slate-800 rounded py-1 px-2 pl-7 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <Search className="absolute left-3 top-1.5 text-slate-600 w-3 h-3" />
          </div>

          <div id="public-channels-list" className="space-y-0.5">
            {publicChannels.map((chan) => {
              const isActive = chan.id === activeChannelId;
              return (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded transition-all text-xs ${
                    isActive 
                      ? "bg-slate-800 text-white font-medium" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="opacity-50 text-base font-light text-slate-500">#</span>
                    <span className="truncate">{chan.name}</span>
                  </span>
                  {!isActive && (
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: DIRECT MESSAGE CHATS */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1.5 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Direct Messages ({directRooms.length})
          </div>

          <div id="dm-rooms-list" className="space-y-0.5">
            {directRooms.map((chan) => {
              const isActive = chan.id === activeChannelId;
              const dmName = getDMName(chan);
              const dmAvatar = getDMAvatar(chan);
              const dmStatus = getDMStatus(chan);
              
              const statusColor = dmStatus === "online" ? "bg-emerald-500" 
                : dmStatus === "away" ? "bg-amber-550" 
                : "bg-slate-600";

              return (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all text-xs ${
                    isActive 
                      ? "bg-slate-800 text-white font-medium" 
                      : "text-slate-400 hover:bg-slate-805 hover:text-slate-200"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={dmAvatar} 
                      alt={dmName} 
                      className="w-5 h-5 rounded object-cover bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-slate-900 ${statusColor}`} />
                  </div>
                  <span className="truncate flex-1 font-medium">{dmName}</span>
                </button>
              );
            })}
            
            {directRooms.length === 0 && (
              <p className="text-[10px] text-slate-600 px-1.5 italic">
                No active DMs. Choose a member below.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: RESIDENTS / ONLINE USERS DIRECTORY */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Residents ({otherUsers.length})
          </div>

          {/* User Search */}
          <div className="relative px-1.5">
            <input
              type="text"
              placeholder="Find residents..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              className="w-full text-[11px] bg-slate-950 border border-slate-800 rounded py-1 px-2 pl-7 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <Search className="absolute left-3 top-1.5 text-slate-600 w-3 h-3" />
          </div>

          <div id="users-directory-list" className="space-y-0.5">
            {otherUsers.map((item) => {
              const statusColor = item.status === "online" ? "bg-emerald-500" 
                : item.status === "away" ? "bg-amber-500" 
                : "bg-slate-600";
              return (
                <div
                  key={item.uid}
                  className="flex items-center justify-between p-1 px-1.5 rounded hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  onClick={() => handleStartDM(item)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={item.photoURL} 
                        alt={item.displayName} 
                        className="w-5 h-5 rounded object-contain bg-slate-950 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-slate-900 ${statusColor}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-300 truncate leading-tight group-hover:text-amber-400">
                        {item.displayName}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] bg-transparent text-slate-500 px-1 py-0.5 rounded group-hover:text-indigo-400 group-hover:bg-slate-805 transition-colors flex items-center gap-0.5 whitespace-nowrap">
                    <UserPlus className="w-2.5 h-2.5" /> DM
                  </span>
                </div>
              );
            })}

            {otherUsers.length === 0 && (
              <p className="text-[10px] text-slate-600 px-1.5 italic text-center py-1">
                No active residents.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* RENDER MODAL: CREATE CHANNELS */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateChannel}
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-indigo-450 animate-pulse" /> Launch a Public Channel
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={25}
                    value={newChanName}
                    onChange={(e) => setNewChanName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. tech-talk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-200 placeholder:text-slate-750"
                  />
                  <span className="absolute left-3 top-2 text-slate-500 text-xs">#</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  About / Description
                </label>
                <textarea
                  value={newChanDesc}
                  maxLength={100}
                  onChange={(e) => setNewChanDesc(e.target.value)}
                  placeholder="What is this channel about?"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-200 placeholder:text-slate-750 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs border border-slate-800 hover:bg-slate-800 rounded text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-550 text-white font-medium rounded disabled:opacity-40"
              >
                {isCreating ? "Establishing..." : "Establish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
