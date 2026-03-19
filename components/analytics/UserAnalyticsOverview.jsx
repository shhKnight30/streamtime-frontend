// components/analytics/UserAnalyticsOverview.jsx
"use client";
import React from 'react';
import { useGetUserAnalyticsQuery } from '@/store/services/analyticsApi';
import { Card } from '@/components/ui/Card'; // Assuming you have a standard Card component
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart, Users, Eye, ThumbsUp, MessageSquare } from 'lucide-react'; // Make sure lucide-react is installed

export default function UserAnalyticsOverview() {
    const { data: response, isLoading, isError } = useGetUserAnalyticsQuery();
    
    if (isLoading) return <Skeleton className="w-full h-32 rounded-xl" />;
    if (isError) return <div className="text-red-500">Failed to load analytics.</div>;

    const stats = response?.data || {};

    const StatCard = ({ title, value, icon: Icon, colorClass }) => (
        <Card className="p-6 flex items-center gap-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm">
            <div className={`p-4 rounded-full ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${textClass}`} />
            </div>
            <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {value?.toLocaleString() || 0}
                </h3>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <BarChart className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold">Channel Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Views" value={stats.totalViews} icon={Eye} bgClass="bg-blue-500" textClass="text-blue-600" />
                <StatCard title="Total Subscribers" value={stats.totalSubscribers} icon={Users} bgClass="bg-green-500" textClass="text-green-600" />
                <StatCard title="Total Likes" value={stats.totalLikes} icon={ThumbsUp} bgClass="bg-pink-500" textClass="text-pink-600" />
                <StatCard title="Total Comments" value={stats.totalComments} icon={MessageSquare} bgClass="bg-orange-500" textClass="text-orange-600" />
            </div>
        </div>
    );
}