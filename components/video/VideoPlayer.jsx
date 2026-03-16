"use client";

import { useState, useRef } from "react";
import ReactPlayer from "react-player";

export function VideoPlayer({
  src,
  poster,
  title,
  layout = 'default',
  autoplay = false,
  controls = true,
  className = '',
  onPlay,
  onPause,
  onEnded,
  width = '100%',
  height = '100%',
}) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const playerRef = useRef(null);

  const handlePlay = () => { setIsPlaying(true); onPlay?.(); };
  const handlePause = () => { setIsPlaying(false); onPause?.(); };
  const handleEnded = () => { setIsPlaying(false); onEnded?.(); };

  const videoUrl = Array.isArray(src) ? src[0] : src;

  return (
    <div className={`video-player-container relative w-full aspect-video ${className}`}>
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        poster={poster}
        playing={isPlaying} 
        controls={controls}
        width={width}
        height={height}
        light={poster && !autoplay}
        pip={true}
        stopOnUnmount={false}
        playsinline={true}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        config={{
          file: {
            attributes: { preload: 'metadata' },
            forceVideo: true,
          }
        }}
        style={{ backgroundColor: '#000000', borderRadius: '12px', overflow: 'hidden' }}
      />
    </div>
  );
}