import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Info, 
  Send, 
  AlertTriangle,
  Play,
  Settings,
  HelpCircle
} from "lucide-react";
import { playToggleClick } from "../utils/audio";

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { 
    notificationSetting, 
    setNotificationSetting, 
    triggerNotification 
  } = useChat();

  const [testTitle, setTestTitle] = useState("Alert Triggered!");
  const [testBody, setTestBody] = useState("Your chat notification systems are active and live.");
  const [testSenderType, setTestSenderType] = useState<"bot" | "user">("bot");

  if (!isOpen) return null;

  const toggleSound = () => {
    const newValue = !notificationSetting.soundEnabled;
    setNotificationSetting(prev => ({ ...prev, soundEnabled: newValue }));
    playToggleClick(newValue);
  };

  const toggleBanner = () => {
    const newValue = !notificationSetting.bannerEnabled;
    setNotificationSetting(prev => ({ ...prev, bannerEnabled: newValue }));
    playToggleClick(newValue);
  };

  const toggleSystem = () => {
    const newValue = !notificationSetting.systemEnabled;
    setNotificationSetting(prev => ({ ...prev, systemEnabled: newValue }));
    playToggleClick(newValue);
  };

  const handleTestTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    const avatar = testSenderType === "bot" 
      ? "https://api.dicebear.com/7.x/bottts/svg?seed=TriggerTest"
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=TestSender";
    triggerNotification(
      testSenderType === "bot" ? "🤖 " + testTitle : "💬 " + testTitle,
      testBody,
      "test-channel-id",
      avatar
    );
  };

  return (
    <div id="notification-settings-bg" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="notification-settings-modal" 
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-120"
      >
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
            <h3 className="font-bold text-sm text-white">Push Alerts & Notification Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Channel Info Explainer */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3.5 flex gap-2.5 text-[11px] leading-relaxed text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5 text-indigo-200">Dual-Tier Push Notification Engine</p>
              <p>
                We have deployed an interactive client alert channel syncing browser native <strong>Notification API triggers</strong> with in-context custom audio chimes and floating notice elements. This ensures real-time feedback regardless of sandbox framing!
              </p>
            </div>
          </div>

          {/* Setting toggles */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notification Channels</h4>
            
            {/* Audio Synthesis Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex gap-2.5">
                <div className="p-1.5 bg-pink-500/10 rounded text-pink-400 shrink-0 self-center">
                  {notificationSetting.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Audio Sound Effects</h5>
                  <p className="text-[10px] text-slate-500">Synthesize chimes using the HTML5 Web Audio API upon incoming messages</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleSound()}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none cursor-pointer ${
                  notificationSetting.soundEnabled ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${
                  notificationSetting.soundEnabled ? "transform translate-x-4" : ""
                }`} />
              </button>
            </div>

            {/* Float HUD banner Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 rounded text-emerald-400 shrink-0 self-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">In-App HUD Floating Banners</h5>
                  <p className="text-[10px] text-slate-500">Appear as animated overlays on top of the UI whenever new messages arrive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleBanner()}
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none cursor-pointer ${
                  notificationSetting.bannerEnabled ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${
                  notificationSetting.bannerEnabled ? "transform translate-x-4" : ""
                }`} />
              </button>
            </div>

            {/* Operating System Native Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 rounded text-indigo-450 shrink-0 self-center">
                  <Monitor className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Desktop Web Push Notifications</h5>
                  <p className="text-[10px] text-slate-500">Requests native permission. Requires a secure context or direct browser tabs</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {"Notification" in window && Notification.permission === "denied" && (
                  <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-mono">
                    Blocked in frame
                  </span>
                )}
                <button
                  type="button"
                  disabled={!("Notification" in window) || ("Notification" in window && Notification.permission === "denied")}
                  onClick={() => toggleSystem()}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none disabled:opacity-40 cursor-pointer ${
                    notificationSetting.systemEnabled ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${
                    notificationSetting.systemEnabled ? "transform translate-x-4" : ""
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Test Sandbox and Injector */}
          <div className="pt-3 border-t border-slate-855">
            <div className="flex items-center gap-1.5 mb-2">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant Push Simulator Tool</h4>
            </div>
            <form onSubmit={handleTestTrigger} className="bg-slate-950 p-3 rounded-lg border border-dashed border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1">Message Sender</label>
                  <select 
                    value={testSenderType} 
                    onChange={(e) => setTestSenderType(e.target.value as "bot" | "user")}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none"
                  >
                    <option value="bot">AI Butler Bot 🤖</option>
                    <option value="user">Alex Stardust 💬</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1">Notification Title</label>
                  <input 
                    type="text" 
                    value={testTitle} 
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none placeholder:text-slate-700"
                    placeholder="E.g. Code Deploy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1">Message Alert Body</label>
                <input 
                  type="text" 
                  value={testBody} 
                  required
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none placeholder:text-slate-700"
                  placeholder="Insert notification body text..."
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1 rounded text-[10px] transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 text-indigo-400" /> Send Simulated Push
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 bg-slate-950 border-t border-slate-850">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-350 rounded font-semibold transition-colors hover:bg-slate-850"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
