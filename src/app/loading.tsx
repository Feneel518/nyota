import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      id="main"
      className="nyota-loading"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="loading-emblem">
        <span className="brand loading-wordmark">nyota</span>
        <span className="loading-progress" />
      </div>
      <p role="status">A little Nyota magic…</p>
      <div className="loading-placeholder">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </main>
  );
}
