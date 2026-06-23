import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import { X, Check, Smile, User, Sparkles } from "lucide-react";
import { playToggleClick } from "../utils/audio";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_SEEDS = [
  { name: "Neon Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Neon" },
  { name: "Stardust", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Stardust" },
  { name: "Drift", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Drift" },
  { name: "Quantum", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Quantum" },
  { name: "Cosmo", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cosmo" },
  { name: "Nova", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nova" },
  { name: "Luna", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" },
  { name: "Aero", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aero" },
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUserProfile, updateProfile, updatePresence } = useChat();
  const [displayName, setDisplayName] = useState(currentUserProfile?.displayName || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUserProfile?.photoURL || "");
  const [activeStatus, setActiveStatus] = useState<"online" | "away" | "offline">(
    currentUserProfile?.status || "online"
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !currentUserProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      playToggleClick(true);
      await updateProfile(displayName.trim(), selectedAvatar);
      await updatePresence(activeStatus);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile-modal-bg" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="profile-modal" 
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-120"
      >
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">Profile Customizer</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Avatar preset selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Avatar Persona
            </label>
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              {AVATAR_SEEDS.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative p-1.5 rounded-lg transition-all aspect-square border bg-slate-900 ${
                      isSelected 
                        ? "border-indigo-500 scale-105 shadow-md" 
                        : "border-transparent hover:border-slate-800"
                    }`}
                  >
                    <img 
                      src={av.url} 
                      alt={av.name} 
                      className="w-10 h-10 object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-0.5 right-0.5 bg-indigo-500 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Display Name Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter alias"
                  className="w-full px-2.5 py-1.5 pl-8 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all text-xs font-semibold"
                />
                <User className="absolute left-2.5 top-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>

            {/* Offline/Online Status Pill selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Presence Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["online", "away", "offline"] as const).map((st) => {
                  const isSelected = activeStatus === st;
                  const colorMap = {
                    online: "bg-emerald-500 text-emerald-400",
                    away: "bg-amber-500 text-amber-400",
                    offline: "bg-slate-500 text-slate-400"
                  };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActiveStatus(st)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded border capitalize transition-all ${
                        isSelected 
                          ? `border-indigo-500 bg-indigo-950/20 font-bold` 
                          : "border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mb-1 ${colorMap[st].split(" ")[0]}`}></span>
                      <span className="text-[10px] font-medium leading-none text-slate-300">{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !displayName.trim()}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-550 text-white font-medium rounded transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
