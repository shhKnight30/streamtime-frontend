"use client";

import { useState } from "react";

export function VideoPlayer({
    src,
    poster,
    title,
    autoplay = false,
    controls = true,
    className = '',
    onPlay,
    onPause,
    onEnded,
}) {
    const videoUrl = Array.isArray(src) ? src[0] : src;

    return (
        <div className={`relative w-full ${className}`} style={{ paddingTop: '56.25%' }}>
            <video
                src={videoUrl}
                poster={poster || ''}
                controls={controls}
                autoPlay={autoplay}
                className="absolute top-0 left-0 w-full h-full"
                crossOrigin="anonymous"
                preload="metadata"
                playsInline
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
                onError={(e) => console.log('Video error:', e.target.error)}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}