"use client";


export function VideoPlayer({
    src,
    poster,
    title,
    autoplay = true,
    controls = true,
    className = '',
}) {
    const videoUrl = Array.isArray(src) ? src[0] : src;

    return (
        <div className={`relative w-full ${className}`} style={{ paddingTop: '56.25%' }}>
            <video
                src={videoUrl}
                poster={poster || ''}
                controls={controls}
                autoPlay={autoplay}
                title={title}
                className="absolute top-0 left-0 w-full h-full"
                crossOrigin="anonymous"
                preload="metadata"
                playsInline
                onError={(e) => console.log('Video error:', e.target.error)}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}