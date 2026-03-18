"use client";

import { useSelector, useDispatch } from "react-redux";
import { logoutUser  } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { User, LogOut, LayoutDashboard, Settings, Clock, PlaySquare, Compass, HelpCircle } from "lucide-react";
import Link from "next/link";

export function NavUserMenu() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  if (!user) return null;

    const handleLogout = async () => {
    try {
        // Clear httpOnly cookies on the backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/logout`, { 
            method: 'POST', 
            credentials: 'include' 
        });
    } catch (_) { 
        // Best-effort backend logout, proceed to clear local state anyway
    }
    
    dispatch(logoutUser()); 
    router.push("/login");
};

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-raised)] transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]">
          <img src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={user.username} className="h-full w-full object-cover" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-lg border-[var(--border)] bg-[var(--surface)]">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-[var(--text-primary)]">{user.fullname}</p>
            <p className="text-xs leading-none text-[var(--text-muted)]">@{user.username}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-[var(--border)]" />
        
        {/* Creator Hub Section */}
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href={`/channel/${user.username}`} className="flex w-full items-center">
            <User className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Your Channel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/dashboard" className="flex w-full items-center">
            <LayoutDashboard className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Creator Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-[var(--border)]" />

        {/* Content & Discovery Section */}
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/explore" className="flex w-full items-center">
            <Compass className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Explore
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/activity" className="flex w-full items-center">
            {/* Using Activity as the hub for both History and Liked Videos */}
            <Clock className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Activity & Liked
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/playlists" className="flex w-full items-center">
            <PlaySquare className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Playlists
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[var(--border)]" />

        {/* System Section */}
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/settings" className="flex w-full items-center">
            <Settings className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)] focus:bg-[var(--surface-raised)]">
          <Link href="/help" className="flex w-full items-center">
            <HelpCircle className="mr-3 h-4 w-4 text-[var(--text-muted)]" /> Help
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-[var(--border)]" />
        
        <DropdownMenuItem className="cursor-pointer p-2 rounded-md text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-500" onClick={handleLogout}>
          <LogOut className="mr-3 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}