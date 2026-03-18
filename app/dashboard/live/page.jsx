"use client"

import { useEffect, useRef } from 'react';
import { useStream } from '@/hooks/useStream';

export default function LiveDashboard() {
    const videoRef = useRef(null);
    const streamId = "stream_12345"; // Replace with actual stream ID from your DB
    const userId = "user_abc";       // Replace with current user ID
    
    const { 
        localStream, 
        isStreaming, 
        error, 
        viewerCount, 
        startStreaming, 
        stopStreaming 
    } = useStream(streamId, userId, "My Awesome Stream");

    // Attach the local media stream to the video tag
    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Live Studio</h1>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-4">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover"
                />
                
                {isStreaming && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>
                )}
            </div>

            <div className="flex gap-4 items-center">
                {!isStreaming ? (
                    <button 
                        onClick={startStreaming}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
                    >
                        Start Streaming
                    </button>
                ) : (
                    <button 
                        onClick={stopStreaming}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
                    >
                        End Stream
                    </button>
                )}
                
                <span className="text-gray-400">
                    👁️ {viewerCount} Viewers
                </span>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}