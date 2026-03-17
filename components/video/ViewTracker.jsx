// components/video/ViewTracker.jsx
"use client";
import { useEffect, useRef } from 'react';
import { useUpdateVideoViewsMutation } from '@/store/services/analyticsApi';

export default function ViewTracker({ videoId }) {
    const [updateViews] = useUpdateVideoViewsMutation();
    const hasTrackedView = useRef(false);

    useEffect(() => {
        if (!videoId || hasTrackedView.current) return;

        // Count as a view after 5 seconds of being on the page
        const timer = setTimeout(() => {
            updateViews(videoId)
                .unwrap()
                .then(() => {
                    hasTrackedView.current = true;
                    console.log('View recorded successfully');
                })
                .catch((err) => console.error('Failed to record view:', err));
        }, 5000);

        return () => clearTimeout(timer);
    }, [videoId, updateViews]);

    // This component renders nothing, it just runs logic
    return null; 
}