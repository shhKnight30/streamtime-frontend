import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--surface-raised)]", className)}
      {...props}
    />
  );
}