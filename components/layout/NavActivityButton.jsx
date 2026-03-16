import Link from "next/link";
import { Activity } from "lucide-react";
import { buttonVariants } from "../ui/Button";
import { cn } from "@/lib/utils";

export function NavActivityButton() {
  return (
    <Link 
      href="/activity"
      title="Your Activity"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }), 
        "h-9 w-9 rounded-full"
      )}
    >
      <Activity className="h-5 w-5" />
      <span className="sr-only">Your Activity</span>
    </Link>
  );
}