"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "@/lib/socket";
import { Send } from "lucide-react";

export default function LiveChat({ streamId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Attach chat listener to the SHARED socket — never create a new connection here
  useEffect(() => {
    if (!streamId) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("new-chat-message", handleMessage);

    return () => {
      socket.off("new-chat-message", handleMessage);
      // NEVER call socket.disconnect() here — it's shared with the WebRTC stream
    };
  }, [streamId]);

  const handleSendMessage = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (!newMessage.trim() || !user || !socket.connected) return;

      socket.emit("send-chat-message", {
        streamId,
        message: newMessage.trim(),
        user: {
          username: user.username || "Guest",
          avatar:
            user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "guest"}`,
        },
      });

      setNewMessage("");
    },
    [newMessage, streamId, user]
  );

  return (
    <div className="flex flex-col h-full bg-[#0f0f13]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h3 className="font-bold text-white text-base">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-8 text-sm">
            Chat messages will appear here
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <img
                src={msg.avatar}
                alt={msg.username}
                className="w-8 h-8 rounded-full bg-gray-800 shrink-0 object-cover"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`;
                }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-200 truncate">
                    {msg.username}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-800 shrink-0"
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSendMessage(e);
            }}
            placeholder={user ? "Say something..." : "Log in to chat"}
            disabled={!user}
            maxLength={500}
            className="flex-1 bg-gray-950 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-800 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !user}
            aria-label="Send message"
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}