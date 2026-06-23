import React, { useState, useEffect } from "react";
import { ChatProvider, useChat } from "./context/ChatContext";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ProfileModal from "./components/ProfileModal";
import NotificationSettings from "./components/NotificationSettings";
import NotificationBanner from "./components/NotificationBanner";
import { 
  Sparkles, 
  Lock, 
  MessageCircle, 
  ShieldCheck, 
  VolumeX, 
  BellRing, 
  Smartphone,
  Cpu,
  Wifi,
  Users
} from "lucide-react";
import { playSuccessChime, playToggleClick } from "./utils/audio";
import { testFirestoreConnection } from "./firebase";

function ChatAppContent() {
  const { user, currentUserProfile, loading, signInWithGoogle } = useChat();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const [pingSpeed, setPingSpeed] = useState<number | null>(null);

  // Measure Firestore real-time latency
  useEffect(() => {
    if (!user) return;
    testFirestoreConnection();
    
    // Simulate real-time signal telemetry ping
    const interval = setInterval(() => {
      const start = Date.now();
      testFirestoreConnection().then(() => {
        setPingSpeed(Date.now() - start);
      }).catch(() => {
        setPingSpeed(null);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-450 tracking-widest uppercase">Opening Signal Corridor...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render our design-crafted Landing page / Gate screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
          
          {/* Left panel: Product features & branding */}
          <div className="md:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-450 px-3.5 py-1.5 rounded-full text-xs font-medium w-fit animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Deployed on Cloud Firestore
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Galactic Signal Chat
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
                Experience real-time direct messaging, custom channels, and HTML5 Web push alerts wrapped under a complete Zero-Trust Security schema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Zero-Trust Rules
                </div>
                <p className="text-[11px] text-slate-400">Strict server-side validation rules prevent identity spoofing and unauthorized read scraping.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <BellRing className="w-4 h-4" /> Dynamic Alerts
                </div>
                <p className="text-[11px] text-slate-400">Integrated notification manager supporting customizable Web Audio sounds and device alerts.</p>
              </div>
            </div>
          </div>

          {/* Right panel: Login authentication form */}
          <div className="md:col-span-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative backdrop-blur-md">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Security Gate</span>
                <h3 className="text-lg font-bold text-white">Authentication Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with any valid authorization token. Authenticated profiles instantly acquire dynamic status hooks and signal keys.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (e) {
                      console.error("Popup fail, user notified:", e);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg active:scale-98 text-sm cursor-pointer"
                >
                  {/* Google Custom Minimal Vector Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 1 12 1 7.35 1 3.4 3.65 1.57 7.5l3.86 3C6.38 7.42 8.98 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.97h3.91c2.28-2.1 3.54-5.19 3.54-8.69z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.43 14.5c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.57 6.9C.57 8.9 0 11.1 0 13.5s.57 4.6 1.57 6.6l3.86-3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.91-2.97c-1.12.75-2.55 1.2-4.05 1.2-3.02 0-5.62-2.38-6.57-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z"
                    />
                  </svg>
                  Connect with Google
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/50 mt-6 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" /> Secure Transport
              </span>
              <span>v1.2.0 • Web SDK</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Logged-in complete messaging dashboard interface with High Density specifications
  return (
    <div className="min-h-screen bg-slate-950 font-sans flex items-center justify-center p-0 md:p-3 transition-all text-slate-200">
      <div 
        id="applet-viewport" 
        className="w-full h-full md:rounded-xl md:border md:border-slate-800 bg-slate-950 shadow-2xl flex overflow-hidden min-h-screen md:min-h-[90vh] md:max-h-[94vh] max-w-7xl animate-in fade-in"
      >
        {/* Unified 3-Pane interface */}
        <Sidebar 
          onOpenProfile={() => setProfileOpen(true)}
          onOpenNotifications={() => setNotifSettingsOpen(true)}
        />
        
        <ChatArea />

        {/* Global Floating banner portals */}
        <NotificationBanner />

        {/* Floating Connection Latency indicator in bottom sidebar */}
        {pingSpeed !== null && (
          <div className="hidden md:flex absolute bottom-5 left-5 bg-slate-900/90 border border-slate-800 rounded-full px-2.5 py-1 items-center gap-1.5 text-[10px] text-indigo-400">
            <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Telemetry: {pingSpeed}ms</span>
          </div>
        )}

        {/* Profiles drawer Modal */}
        <ProfileModal 
          isOpen={profileOpen} 
          onClose={() => setProfileOpen(false)} 
        />

        {/* Notifications & Push Simulator Modal */}
        <NotificationSettings 
          isOpen={notifSettingsOpen} 
          onClose={() => setNotifSettingsOpen(false)} 
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <ChatAppContent />
    </ChatProvider>
  );
}
