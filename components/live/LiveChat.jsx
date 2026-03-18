import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function LiveChat({ streamId, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new message arrives
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Initialize chat socket
        const socket = io('http://localhost:8000', {
            withCredentials: true,
        });
        socketRef.current = socket;

        // Join the stream room for chat routing
        socket.emit('join-stream', streamId);

        // Listen for incoming messages
        socket.on('new-chat-message', (messageData) => {
            setMessages((prev) => [...prev, messageData]);
        });

        return () => {
            socket.emit('leave-stream', streamId);
            socket.disconnect();
        };
    }, [streamId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        // Emit to backend
        socketRef.current.emit('send-chat-message', {
            streamId,
            message: newMessage.trim(),
            user: {
                username: currentUser?.username || 'Anonymous',
                avatar: currentUser?.avatar || '/default-avatar.png'
            }
        });

        setNewMessage('');
    };

    return (
       <div className="flex flex-col h-[520px] w-full max-w-md bg-[#0f1117] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b0d12]">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    <h3 className="text-sm font-semibold text-white/90">Live Chat</h3>
  </div>
  <span className="text-xs text-white/40">{messages.length} msgs</span>
</div>  

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
               {messages.length === 0 ? (
  <div className="h-full flex items-center justify-center">
    <p className="text-white/30 text-sm">
      No messages yet.
    </p>
  </div>
) : (
  messages.map((msg, i) => {
    const prev = messages[i - 1];
    const isSameUser = prev?.username === msg.username;

    return (
      <div key={msg.id} className="flex gap-3">
        
        {/* Avatar (only if new user) */}
        {!isSameUser ? (
          <img
            src={msg.avatar}
            className="w-8 h-8 rounded-full object-cover mt-1"
          />
        ) : (
          <div className="w-8" />
        )}

        <div className="flex flex-col">
          
          {/* Username row */}
          {!isSameUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">
                {msg.username}
              </span>
              <span className="text-[11px] text-white/40">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-white/80 leading-relaxed">
            {msg.text}
          </p>
        </div>
      </div>
    );
  })
)}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
  onSubmit={handleSendMessage}
  className="p-3 border-t border-white/10 bg-[#0b0d12]"
>
  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-blue-500 transition">
    
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Message..."
      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
    />

    <button
      type="submit"
      disabled={!newMessage.trim()}
      className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-white/20 transition"
    >
      Send
    </button>
  </div>
</form>
        </div>
    );
}