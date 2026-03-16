"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { buttonVariants } from "../ui/Button";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";
import { NavCreateButton } from "./NavCreateButton";
import { NavActivityButton } from "./NavActivityButton";
import { NavUserMenu } from "./NavUserMenu";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/Sheet";
import { Sidebar } from "./Sidebar";


export function Navbar() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex shrink-0 items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="rounded-full p-2 hover:bg-[var(--surface-raised)] focus:outline-none">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b border-[var(--border)] text-left">
                <SheetTitle className="flex items-center gap-2 font-bold text-lg tracking-tight">
                  StreamTime
                </SheetTitle>
              </SheetHeader>
              <div className="px-3 h-[calc(100vh-65px)] overflow-y-auto">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            StreamTime
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center px-6">
          <SearchBar />
        </div>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              <NavCreateButton />
              <NavActivityButton />
              <div className="ml-2 pl-2 border-l border-[var(--border)]">
                <NavUserMenu />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Log in
              </Link>
              <Link 
                href="/register" 
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Register
              </Link>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
}