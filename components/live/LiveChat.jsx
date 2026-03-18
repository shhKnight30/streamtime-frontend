"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function LiveChat({ streamId, user }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Auto-scroll to the newest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        // Connect to a dedicated chat socket connection
        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000', {
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.emit('join-stream', streamId);

        socket.on('new-chat-message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.emit('leave-stream', streamId);
            socket.disconnect();
        };
    }, [streamId]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        socketRef.current.emit('send-chat-message', {
            streamId,
            message: newMessage.trim(),
            user: {
                username: user?.username || 'Guest',
                avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
            }
        });

        setNewMessage('');
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80">
                <h3 className="font-bold text-white">Live Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] scrollbar-thin scrollbar-thumb-gray-800">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4">Welcome to the chat room!</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                            <img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-gray-800" />
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm text-gray-200">{msg.username}</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 break-words">{msg.text}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-900/50 relative">
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-[100%] right-4 mb-2 z-50 shadow-2xl">
                        <EmojiPicker 
                            onEmojiClick={onEmojiClick}
                            theme="dark"
                            autoFocusSearch={false}
                            searchPlaceHolder="Search emojis..."
                            width={300}
                            height={400}
                        />
                    </div>
                )}
                
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors bg-gray-950 rounded-xl border border-gray-800 hover:border-blue-500/50"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Say something..."
                        className="flex-1 bg-gray-950 text-white rounded-xl px-4 py-3 text-sm border border-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    
                    <button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:shadow-none"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}