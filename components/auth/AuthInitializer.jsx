// components/auth/AuthInitializer.jsx
"use client"

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logoutUser } from "@/store/slices/authSlice";
import { useGetCurrentUserQuery } from "@/store/services/userApi";

export function AuthInitializer({ children }) {
    const dispatch = useDispatch();
    const { data, isSuccess, isError, isLoading } = useGetCurrentUserQuery();

    useEffect(() => {
        if (isSuccess && data?.data) {
            dispatch(setCredentials({
                user: data.data,
                // Don't store "persisted" — just mark as authenticated
                // The cookie handles actual auth; we only need the user object in Redux
                accessToken: null,
                isAuthenticated: true,
            }));
        }
        else if (isError) {
            dispatch(logoutUser());
        }
    }, [isSuccess, isError, data, dispatch]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]" />
            </div>
        );
    }

    return <>{children}</>;
}