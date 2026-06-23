import React from "react";
import { useChat } from "../context/ChatContext";
import { X, MessageSquare, BellRing } from "lucide-react";

export default function NotificationBanner() {
  const { inAppNotifications, dismissNotification, setActiveChannelId } = useChat();

  if (inAppNotifications.length === 0) return null;

  return (
    <div 
      id="notification-portal"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {inAppNotifications.map((notif) => {
        return (
          <div
            key={notif.id}
            id={`notif-${notif.id}`}
            className="pointer-events-auto bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-2.5 flex gap-2.5 items-start animate-in slide-in-from-right duration-200 hover:border-slate-700 transition-colors cursor-pointer"
            onClick={() => {
              if (notif.roomId && notif.roomId !== "test-channel-id") {
                setActiveChannelId(notif.roomId);
              }
              dismissNotification(notif.id);
            }}
          >
            {/* Avatar or Icon */}
            {notif.avatar ? (
              <img 
                src={notif.avatar} 
                alt="Notif Source" 
                className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-855 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
            )}

            {/* Title / Body */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-white truncate">
                  {notif.title}
                </span>
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-ping shrink-0" />
              </div>
              <p className="text-[10px] text-slate-350 font-normal leading-snug line-clamp-2">
                {notif.body}
              </p>
              <span className="text-[9px] text-slate-500 mt-0.5 block">
                Just now
              </span>
            </div>

            {/* Dismiss Cross */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notif.id);
              }}
              className="p-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
