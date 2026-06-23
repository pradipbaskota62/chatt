import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { 
  Send, 
  Image, 
  Smile, 
  Trash2, 
  Paperclip, 
  Hash, 
  MessageSquare, 
  X, 
  Sparkles, 
  Clock, 
  Check, 
  ArrowDown,
  ExternalLink
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db, handleFirestoreError } from "../firebase";
import { Message, OperationType } from "../types";
import { playMessagePing, playToggleClick } from "../utils/audio";

const PRESET_IMAGES = [
  { label: "Deep Cosmic Nebula", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=600&q=80" },
  { label: "Cyberpunk Alley", url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=600&q=80" },
  { label: "Cozy Coding Cafe", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80" },
  { label: "Retro Synthwave", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80" },
];

const EMOJIS = ["😀", "😂", "🔥", "🚀", "⚡", "👍", "❤️", "🙌", "🤖", "🎉", "👀", "✨"];

export default function ChatArea() {
  const { user, activeChannel, users, triggerNotification } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load and listen to messages in active channel
  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "channels", activeChannel.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const list: Message[] = [];
      let containsAlternativeSenderMessage = false;
      let lastSenderName = "";
      let lastSenderPhoto = "";
      let lastContent = "";

      snapshot.forEach((doc) => {
        const msg = doc.data() as Message;
        list.push(msg);
      });

      // Simple incoming check to trigger sound/notifications when someone else posts
      if (list.length > messages.length && messages.length > 0) {
        const newest = list[list.length - 1];
        if (newest.senderId !== user?.uid) {
          playMessagePing();
          // Log simulated alert if desired
          triggerNotification(
            "New Message in #" + (activeChannel.type === "public" ? activeChannel.name : "Direct Room"),
            `${newest.senderName}: ${newest.content.substring(0, 50)}`,
            activeChannel.id,
            newest.senderPhoto
          );
        }
      }

      setMessages(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `channels/${activeChannel.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeChannel, user]);

  // Handle auto-scroll
  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Check if within 40px of bottom
    const closeToBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsScrolledToBottom(closeToBottom);
  };

  // Triggers submitting text/image contents
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChannel) return;
    if (!text.trim() && !imageInput) return;

    setIsSending(true);
    const contentText = text.trim();
    const attachedImage = imageInput;
    
    setText("");
    setImageInput("");
    setShowAttachmentMenu(false);
    setShowEmojiMenu(false);

    try {
      const msgRef = doc(collection(db, "channels", activeChannel.id, "messages"));
      
      const newMsg: Message = {
        id: msgRef.id,
        roomId: activeChannel.id,
        senderId: user.uid,
        senderName: user.displayName || "Resident",
        senderPhoto: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        content: contentText || "Sent an attachment reference.",
        createdAt: serverTimestamp()
      };

      if (attachedImage) {
        newMsg.imageUrl = attachedImage;
      }

      await setDoc(msgRef, newMsg);
      setIsScrolledToBottom(true);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Triggers message destruction
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChannel) return;
    try {
      playToggleClick(false);
      const msgRef = doc(db, "channels", activeChannel.id, "messages", msgId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiMenu(false);
  };

  // Helper to obtain DM display title in header
  const getHeaderDisplayName = () => {
    if (!activeChannel) return "";
    if (activeChannel.type === "public") return "#" + activeChannel.name;
    
    // Direct message calculation
    const peerId = activeChannel.memberIds.find((id: string) => id !== user?.uid);
    const peerProfile = users.find((u) => u.uid === peerId);
    return peerProfile ? "💬 " + peerProfile.displayName : "Direct Conversation";
  };

  const getHeaderDisplayDescription = () => {
    if (!activeChannel) return "";
    if (activeChannel.type === "public") return activeChannel.description;
    
    const peerId = activeChannel.memberIds.find((id: string) => id !== user?.uid);
    const peerProfile = users.find((u) => u.uid === peerId);
    return peerProfile ? `${peerProfile.displayName} is currently ${peerProfile.status}` : "Private conversation thread.";
  };

  // Helper to format timestamps gracefully
  const formatTime = (createdAt: any) => {
    if (!createdAt) return "Sending...";
    try {
      // standard Firestore Timestamp
      const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center select-none">
        <div className="w-14 h-14 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 animate-pulse">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">Begin your real-time conversations</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Welcome to the Galactic Signal. Establish a public room using the sidebar or select any resident directory contact to spin up an instant private DM.
        </p>
      </div>
    );
  }

  return (
    <div id="chat-pane" className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      
      {/* Header Container */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg font-light text-slate-500 shrink-0">#</span>
          <h2 className="text-sm font-bold text-white truncate capitalize">
            {getHeaderDisplayName().replace(/^[#💬]\s*/, "")}
          </h2>
          <div className="h-3.5 w-px bg-slate-800 mx-1.5 shrink-0" />
          <p className="text-[11px] text-slate-400 truncate hidden sm:block">
            {getHeaderDisplayDescription()}
          </p>
        </div>
        
        {/* Dynamic total member count in header */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-slate-800/80 text-slate-400 font-bold tracking-wide uppercase px-2 py-0.5 rounded border border-slate-700">
            ID: {activeChannel.id.substring(0, 6)}
          </span>
        </div>
      </div>

      {/* Messages Scroll Feed */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div 
              key={msg.id}
              className="flex items-start gap-3 w-full group animate-in fade-in slide-in-from-bottom-1 duration-120 py-0.5 hover:bg-slate-900/20 px-1 rounded"
            >
              {/* Sender Avatar */}
              <img 
                src={msg.senderPhoto} 
                alt={msg.senderName} 
                className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-800 shrink-0 mt-0.5"
                referrerPolicy="no-referrer"
              />

              {/* Message Details Row */}
              <div className="flex-1 min-w-0 space-y-0.5">
                
                {/* Meta details */}
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-bold ${isMe ? "text-emerald-400" : "text-slate-200"}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                {/* Styled text container */}
                <div className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                  <p>{msg.content}</p>

                  {/* Render attached image */}
                  {msg.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden max-w-xs border border-slate-800 inline-block">
                      <img 
                        src={msg.imageUrl} 
                        alt="Shared attachments" 
                        className="w-full h-auto object-cover max-h-40"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {/* Danger Delete Trigger on hover */}
                {isMe && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-[9px] text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pt-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> retract
                  </button>
                )}

              </div>
            </div>
          );
        })}

        {/* Empty placeholder */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <span className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-slate-600" />
            </span>
            <p className="text-xs font-semibold text-slate-400">Transmission queue is clear</p>
            <p className="text-[10px] text-slate-600 mt-0.5">This marks the start of communication inside this channel.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Down Floating Indicator */}
      {!isScrolledToBottom && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 bg-slate-900 border border-slate-800 text-white rounded-full p-1.5 hover:bg-slate-800 shadow-xl flex items-center justify-center animate-bounce z-10"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Input bar section */}
      <div className="p-4 pt-0 mt-auto shrink-0 z-10">
        
        {/* Render Preview of Image Upload */}
        {imageInput && (
          <div className="flex items-center justify-between p-2 pl-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg mb-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Image className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-medium text-indigo-300 truncate max-w-md">
                Attached custom image reference
              </span>
            </div>
            <button
              onClick={() => setImageInput("")}
              className="p-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-indigo-550 shadow-xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
            
            {/* Picture Attachments selection tray toggle */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  playToggleClick(true);
                  setShowAttachmentMenu(!showAttachmentMenu);
                  setShowEmojiMenu(false);
                }}
                className={`p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center cursor-pointer ${
                  showAttachmentMenu ? "text-indigo-400" : ""
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Attachment dropdown menu selection */}
              {showAttachmentMenu && (
                <div className="absolute bottom-10 left-0 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-3 z-40 space-y-2.5 animate-in fade-in slide-in-from-bottom-1 duration-100">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Preset Images
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() => {
                          setImageInput(img.url);
                          setShowAttachmentMenu(false);
                        }}
                        className="group flex flex-col text-left rounded overflow-hidden border border-slate-800 hover:border-indigo-500 bg-slate-950 transition-all text-[9px]"
                      >
                        <img 
                          src={img.url} 
                          alt={img.label} 
                          className="w-full h-10 object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="p-0.5 font-bold text-slate-550 truncate overflow-hidden max-w-full">
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-slate-805 pt-2">
                    <label className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                      Paste source URL
                    </label>
                    <input
                      type="url"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-200 placeholder:text-slate-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input Element */}
            <div className="flex-1 relative flex items-center min-w-0">
              <input
                type="text"
                value={text}
                maxLength={1500}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message #${getHeaderDisplayName().replace(/^[#💬]\s*/, "")}`}
                className="w-full bg-transparent border-none text-xs focus:outline-none text-slate-200 placeholder:text-slate-650"
              />
              
              {/* Quick insert emoji trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiMenu(!showEmojiMenu);
                  setShowAttachmentMenu(false);
                }}
                className="absolute right-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Emoji container lists */}
              {showEmojiMenu && (
                <div className="absolute bottom-10 right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-2 z-40 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-1">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => insertEmoji(em)}
                      className="text-base hover:scale-120 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit transmission button */}
            <button
              type="submit"
              disabled={isSending || (!text.trim() && !imageInput)}
              className="p-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Tiny bottom support flags */}
          <div className="flex gap-2 text-[10px] text-slate-500 px-0.5 justify-between select-none">
            <span className="font-mono">markdown enabled</span>
            <span className="font-mono italic">Enter to submit</span>
          </div>
        </div>
      </div>

    </div>
  );
}
