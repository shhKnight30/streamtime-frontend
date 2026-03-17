"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { buttonVariants } from "../ui/Button";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";
import { NavCreateButton } from "./NavCreateButton";
import { NavActivityButton } from "./NavActivityButton";
import { NavUserMenu } from "./NavUserMenu";
// Using Feather (looks like a quill/tweet) and Tv for the icons
import { Tv, Feather } from "lucide-react"; 

export function Navbar() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const pathname = usePathname();

  // Check if we are currently on the tweets page
  const isTweetsPage = pathname === "/tweets";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* LOGO & APP TOGGLE */}
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="hidden sm:flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 hover:opacity-80 transition-opacity">
            StreamTime
          </Link>

          {/* ✅ THE NEW TOGGLE (Replaces Sidebar) */}
          <div className="flex items-center rounded-full bg-[var(--surface-raised)] p-1 border border-[var(--border)]">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all",
                !isTweetsPage 
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Tv className="h-4 w-4" />
              <span className="hidden md:inline">Videos</span>
            </Link>
            
            <Link
              href="/tweets"
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all",
                isTweetsPage 
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm text-blue-500" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Feather className="h-4 w-4" />
              <span className="hidden md:inline">Community</span>
            </Link>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center px-4 max-w-2xl hidden md:flex">
          <SearchBar />
        </div>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <>
              <NavCreateButton />
              <NavActivityButton />
              <div className="ml-1 pl-2 border-l border-[var(--border)]">
                <NavUserMenu />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Log in</Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>Register</Link>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
}