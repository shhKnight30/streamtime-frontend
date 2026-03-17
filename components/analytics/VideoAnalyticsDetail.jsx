// components/analytics/VideoAnalyticsDetail.jsx
"use client";
import React from 'react';
import { useGetVideoAnalyticsQuery } from '@/store/services/analyticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

export default function VideoAnalyticsDetail({ videoId }) {
    const { data: response, isLoading } = useGetVideoAnalyticsQuery(videoId);

    if (isLoading) return <Skeleton className="w-full h-24" />;
    
    const stats = response?.data || {};

    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg flex justify-between items-center border border-zinc-200 dark:border-zinc-700">
            <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Views</p>
                <p className="text-lg font-bold">{stats.views || 0}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Likes</p>
                <p className="text-lg font-bold">{stats.likes || 0}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Comments</p>
                <p className="text-lg font-bold">{stats.comments || 0}</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Watch Time</p>
                {/* Assuming duration/watch time might be returned */}
                <p className="text-lg font-bold">{stats.averageViewDuration || '0:00'}</p>
            </div>
        </div>
    );
}