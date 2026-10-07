import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main id="main" className="prose-page" aria-label="Loading page">
      <Skeleton className="h-14 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-72 w-full" />
    </main>
  );
}
