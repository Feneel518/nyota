import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/site";
export default function Loading() {
  return (
    <main
      id="main"
      className="nyota-loading"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="loading-emblem">
        <BrandMark />
        <span />
      </div>
      <p role="status">A little Nyota magic…</p>
      <div className="loading-placeholder">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </main>
  );
}
