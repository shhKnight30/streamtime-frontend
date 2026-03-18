import Link from "next/link";
import { Plus, Upload, Edit3, Radio } from "lucide-react";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

export function NavCreateButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-[var(--border)] bg-[var(--surface)] p-2">
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)]">
          <Link href="/upload" className="flex items-center">
            <Upload className="mr-3 h-4 w-4 text-[var(--text-muted)]" />
            <span>Upload Video</span>
          </Link>
        </DropdownMenuItem>
        
        {/* ✅ NEW: Go Live Button */}
        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)]">
          <Link href="/dashboard/live" className="flex items-center">
            <Radio className="mr-3 h-4 w-4 text-red-500" />
            <span className="font-medium text-[var(--text-primary)]">Go Live</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer p-2 rounded-md hover:bg-[var(--surface-raised)]">
          <Link href="/tweets" className="flex items-center">
            <Edit3 className="mr-3 h-4 w-4 text-[var(--text-muted)]" />
            <span>Post Tweet</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}