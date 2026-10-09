import { adminFilters, customerCsv } from "@/lib/admin";
import { exportCustomers } from "@/server/admin";
import { endpoint } from "@/server/security";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return endpoint(async () => {
    const filters = adminFilters(new URL(request.url).searchParams);
    const rows = await exportCustomers(filters);
    return new Response(customerCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nyota-${filters.segment}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
