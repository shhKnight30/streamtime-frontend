"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Home, Compass, PlaySquare, Clock, ThumbsUp, Users, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "../ui/Sheet";

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const mainLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Subscriptions", href: "/feed", icon: Users, requireAuth: true },
  ];

  const libraryLinks = [
    { name: "Library", href: "/playlists", icon: PlaySquare, requireAuth: true },
    { name: "Activity", href: "/activity", icon: Clock, requireAuth: true },
    { name: "Liked Videos", href: "/liked", icon: ThumbsUp, requireAuth: true },
  ];

  const NavItem = ({ link }) => {
    // Hide links that require authentication if the user is logged out
    if (link.requireAuth && !isAuthenticated) return null;

    const isActive = pathname === link.href;

    return (
      <SheetClose asChild>
        <Link
          href={link.href}
          className={cn(
            "flex items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive 
              ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" 
              : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          )}
        >
          <link.icon className={cn("h-5 w-5", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")} />
          {link.name}
        </Link>
      </SheetClose>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 py-4">
      <div className="flex flex-col gap-1">
        {mainLinks.map((link) => (
          <NavItem key={link.name} link={link} />
        ))}
      </div>

      <div className="h-px bg-[var(--border)]" />

      <div className="flex flex-col gap-1">
        {libraryLinks.map((link) => (
          <NavItem key={link.name} link={link} />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        <SheetClose asChild>
          <Link href="/settings" className="flex items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link href="/help" className="flex items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
            <HelpCircle className="h-5 w-5" />
            Help
          </Link>
        </SheetClose>
      </div>
    </div>
  );
}