'use client'

import { useState, useEffect, useRef } from 'react';
import { useStream } from '@/hooks/useStream';

export default function LiveDashboard() {
    // UI State
    const [step, setStep] = useState('setup'); // 'setup' | 'studio'
    const [isCreating, setIsCreating] = useState(false);
    
    // Stream DB Data
    const [streamDetails, setStreamDetails] = useState({
        id: null,
        title: '',
        category: 'gaming',
        visibility: 'public'
    });

    // Dummy user - replace with your actual auth context / Redux state
    const currentUser = { id: "user_123", username: "HostUser" };

    // --- STEP 1: SETUP COMPONENT ---
    const handleCreateStream = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            // NOTE: Replace with your actual API hook (e.g., RTK Query useCreateLiveStreamMutation)
            // or standard axios call pointing to your liveStream.controller.js createLiveStream route
            const response = await fetch('http://localhost:4000/api/v1/livestreams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${your_token_here}` // if needed
                },
                body: JSON.stringify({
                    title: streamDetails.title,
                    category: streamDetails.category,
                    visibility: streamDetails.visibility
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setStreamDetails(prev => ({ ...prev, id: data.data.stream._id }));
                setStep('studio'); // Move to the camera view
            } else {
                alert("Failed to create stream in DB: " + data.message);
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("Network error while creating stream");
        } finally {
            setIsCreating(false);
        }
    };

    if (step === 'setup') {
        return (
            <div className="max-w-2xl mx-auto p-6 mt-10 bg-gray-900 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold mb-6 text-white">Setup Your Live Stream</h1>
                <form onSubmit={handleCreateStream} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Stream Title</label>
                        <input 
                            required
                            type="text" 
                            value={streamDetails.title}
                            onChange={e => setStreamDetails({...streamDetails, title: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Catchy title for your stream..."
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select 
                                value={streamDetails.category}
                                onChange={e => setStreamDetails({...streamDetails, category: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="gaming">Gaming</option>
                                <option value="education">Education</option>
                                <option value="talk">Talk Show</option>
                                <option value="music">Music</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Visibility</label>
                            <select 
                                value={streamDetails.visibility}
                                onChange={e => setStreamDetails({...streamDetails, visibility: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="public">Public</option>
                                <option value="unlisted">Unlisted</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isCreating || !streamDetails.title}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg mt-6"
                    >
                        {isCreating ? 'Creating Room...' : 'Go to Live Studio'}
                    </button>
                </form>
            </div>
        );
    }

    // --- STEP 2: STUDIO COMPONENT (WebRTC) ---
    return <LiveStudio streamDetails={streamDetails} currentUser={currentUser} />;
}

// Extracted Studio Component to keep the file clean
function LiveStudio({ streamDetails, currentUser }) {
    const videoRef = useRef(null);
    
    // Initialize WebRTC Hook using the real MongoDB ID
    const { 
        localStream, 
        isStreaming, 
        error, 
        viewerCount, 
        startStreaming, 
        stopStreaming 
    } = useStream(streamDetails.id, currentUser.id, streamDetails.title);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">{streamDetails.title}</h1>
                    <p className="text-gray-400 capitalize">Category: {streamDetails.category} • Visibility: {streamDetails.visibility}</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium">
                        👁️ {viewerCount} Viewers
                    </span>
                    {!isStreaming ? (
                        <button 
                            onClick={startStreaming}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                        >
                            Go Live
                        </button>
                    ) : (
                        <button 
                            onClick={stopStreaming}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                        >
                            End Stream
                        </button>
                    )}
                </div>
            </div>
            
            <div className="aspect-video bg-black rounded-xl border border-gray-800 overflow-hidden relative shadow-2xl">
                {!localStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Camera preview will appear here
                    </div>
                )}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirrored for natural feel
                />
                
                {isStreaming && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
}