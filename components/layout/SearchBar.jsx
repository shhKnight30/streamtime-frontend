"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "../ui/Input";
import { useDebounce } from "@/hooks/useDebounce";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state with the current URL search query if it exists
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  
  // Debounce the search term by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Whenever the debounced term changes, update the URL
    if (debouncedSearchTerm) {
      router.replace(`/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
    } else if (debouncedSearchTerm === "" && searchParams.has("q")) {
      // If cleared, go back to home or a default search state
      router.push("/");
    }
  }, [debouncedSearchTerm, router, searchParams]);

  return (
    <div className="relative w-full max-w-md hidden sm:block">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-[var(--text-muted)]" />
        <Input
          type="text"
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-full pl-10 pr-4 bg-[var(--surface-raised)] border-transparent focus-visible:border-[var(--text-primary)] focus-visible:ring-0"
        />
      </div>
    </div>
  );
}