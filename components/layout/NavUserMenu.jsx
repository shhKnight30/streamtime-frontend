import Link from "next/link";

import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "next-themes";

import { User, BarChart, Settings, LogOut, Moon, Sun } from "lucide-react";



import { logoutUser } from "@/store/slices/authSlice";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuLabel,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "../ui/DropdownMenu";



export function NavUserMenu() {

  const dispatch = useDispatch();

  const { theme, setTheme } = useTheme();

  const { user, isCreator } = useSelector((state) => state.auth);



  const handleLogout = () => {

    // Clear cookie (if testing frontend only) or call logout API

    document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    dispatch(logoutUser());

    window.location.href = "/login"; // Force full reload to clear state

  };



  return (

    <DropdownMenu>

      <DropdownMenuTrigger className="focus:outline-none">

        <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--surface-raised)] border border-[var(--border)] transition-opacity hover:opacity-80">

          <img

            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'fallback'}`}

            alt={user?.username || "User avatar"}

            className="h-full w-full object-cover"

          />

        </div>

      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">

        <div className="flex items-center gap-2 p-2">

          <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--surface-raised)]">

            <img

              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'fallback'}`}

              alt="Avatar"

              className="h-full w-full object-cover"

            />

          </div>

          <div className="flex flex-col space-y-0.5 overflow-hidden">

            <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>

            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>

          </div>

        </div>

        

        <DropdownMenuSeparator />

        

        <DropdownMenuItem asChild>

          <Link href={`/channel/${user?._id}`}>

            <User className="mr-2 h-4 w-4" />

            <span>Your Channel</span>

          </Link>

        </DropdownMenuItem>

        

        {isCreator && (

          <DropdownMenuItem asChild>

            <Link href="/dashboard">

              <BarChart className="mr-2 h-4 w-4" />

              <span>Dashboard</span>

            </Link>

          </DropdownMenuItem>

        )}

        

        <DropdownMenuItem asChild>

          <Link href="/channel/edit">

            <Settings className="mr-2 h-4 w-4" />

            <span>Edit Profile</span>

          </Link>

        </DropdownMenuItem>



        <DropdownMenuSeparator />



        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>

          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}

          <span>Toggle Theme</span>

        </DropdownMenuItem>



        <DropdownMenuSeparator />



        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">

          <LogOut className="mr-2 h-4 w-4" />

          <span>Logout</span>

        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>

  );

}