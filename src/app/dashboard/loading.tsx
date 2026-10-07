import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="workspace nyota-dashboard" aria-busy="true">
      <header className="workspace-header">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </header>
      <main id="main" aria-label="Loading your invitations">
        <div className="page-heading dashboard-welcome">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="dashboard-overview">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <section aria-label="Loading invitations">
          <Skeleton className="h-64 w-full rounded-xl" />
        </section>
      </main>
    </div>
  );
}
