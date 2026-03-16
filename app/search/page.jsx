import { SearchClient } from "./SearchClient";

// Next.js 16 requirement: searchParams is a Promise
export default async function SearchPage({ searchParams }) {
  // Await the searchParams promise
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  return <SearchClient query={query} />;
}