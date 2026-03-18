'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useViewer } from '@/hooks/useViewer'
import LiveChat from '@/components/live/LiveChat' // <-- Import Chat

export default function ViewerPage() {
    const { streamId } = useParams()
    const videoRef = useRef(null)
    
    // In a real app, get this from your Redux store / Auth context
    const currentUser = { username: "Viewer_" + Math.floor(Math.random() * 1000) }; 
    const userId = currentUser.username;

    const { remoteStream, isLive, error, viewerCount, startViewing } = useViewer(streamId, userId)

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    useEffect(() => {
        startViewing()
    }, [])

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Live Stream</h1>
                <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full text-sm">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{viewerCount} Viewers</span>
                </div>
            </div>

            {/* Grid Layout: Video on left (auto-scales), Chat on right (fixed width) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Video Player Column */}
                <div className="lg:col-span-3 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative">
                   {(!isLive && !remoteStream) || error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
            {error ? (
                <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <span className="text-red-500 text-2xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-red-400">{error}</p>
                    <button 
                        onClick={() => window.history.back()}
                        className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                </>
            ) : (
                <p className="text-gray-400">Waiting for stream to start...</p>
            )}
        </div>
    ) : null}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Chat Column */}
                <div className="lg:col-span-1">
                    <LiveChat streamId={streamId} currentUser={currentUser} />
                </div>
                
            </div>
        </div>
    )
}