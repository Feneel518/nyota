"use client";
import { useUiLanguage } from "@/components/owner-language";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { type InvitationContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type Data = {
  rows: {
    id: string;
    family: string;
    attending: boolean;
    counts: Record<string, number>;
    note: string;
    createdAt: string;
    updatedAt: string;
  }[];
  total: number;
  totals: { responses: number; attending: number; declines: number };
  visits: number;
  eventTotals: Record<string, number>;
};
export function Responses({
  id,
  content,
  initial,
}: {
  id: string;
  content: InvitationContent;
  initial: Data;
}) {
  const { t } = useUiLanguage();

  const [data, setData] = useState(initial),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(
        await api<Data>(
          `/api/weddings/${id}/responses?q=${encodeURIComponent(search)}&page=${page}`,
        ),
      );
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id, search, page]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 300);
    return () => clearTimeout(timer);
  }, [refresh]);
  return (
    <main id="main" className="workspace pb-20">
      <div className="page-heading">
        <div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft data-icon="inline-start" />
              {t("Your invitations")}
            </Link>
          </Button>
          <h1 className="mt-4">{t("The people who make it.")}</h1>
          <p>
            {content.names.map((n) => n[content.defaultLanguage]).join(" & ")}
            {t("· Guest responses")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/weddings/${id}/export`}>
            <Download data-icon="inline-start" />
            {t("Export CSV")}
          </a>
        </Button>
      </div>
      <div className="metric-grid">
        {[
          [data.totals.responses, t("Responses")],
          [data.totals.attending, t("Attending families")],
          [data.totals.declines, t("Declines")],
          [data.visits, t("Approximate visits")],
        ].map(([value, label]) => (
          <div className="metric" key={label}>
            <strong>{value}</strong>
            <p>{label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-3xl mb-5">{t("Confirmed people by event")}</h2>
      <div className="flex flex-wrap gap-4">
        {content.events.map((e) => (
          <div className="border rounded-lg p-4" key={e.id}>
            <p className="small-note">
              {e.title[content.defaultLanguage]}
              {e.archived ? " · archived" : ""}
            </p>
            <strong className="text-2xl tabular-nums">
              {data.eventTotals[e.id] || 0}
            </strong>
          </div>
        ))}
      </div>
      <p className="small-note mt-4">
        {t(
          "People are counted separately for each event. These totals are not a unique guest count. Visits are approximate and may include repeat opens.",
        )}
      </p>
      <div className="response-tools">
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t("Search families")}
            placeholder={t("Find a family…")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </InputGroup>
        <Button variant="outline" onClick={refresh}>
          {t("Refresh responses")}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("Could not refresh responses")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {data.rows.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Family / group")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                {content.events.map((e) => (
                  <TableHead key={e.id}>
                    {e.title[content.defaultLanguage]}
                    {e.archived ? " (archived)" : ""}
                  </TableHead>
                ))}
                <TableHead>{t("Note")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("Actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.family}</TableCell>
                  <TableCell>
                    <Badge variant={r.attending ? "secondary" : "outline"}>
                      {r.attending ? t("Attending") : t("Declined")}
                    </Badge>
                  </TableCell>
                  {content.events.map((e) => (
                    <TableCell key={e.id}>
                      {r.counts[e.id] || (r.attending ? t("No response") : "—")}
                    </TableCell>
                  ))}
                  <TableCell className="max-w-60 whitespace-normal">
                    {r.note || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete response from ${r.family}`}
                      onClick={() => setDeleting(r.id)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("Previous")}
            </Button>
            <span className="small-note">
              {t("Page")}
              {page}
              {t("of")}
              {Math.max(1, Math.ceil(data.total / 25))}
            </span>
            <Button
              variant="outline"
              disabled={page * 25 >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Next")}
            </Button>
          </div>
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {search
                ? t("No matching families")
                : t("Good company is on its way.")}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? t("Try another name or clear your search.")
                : t(
                    "Share your invitation. Your first guest response will appear here.",
                  )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => {
          if (!v && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this response?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This removes the family’s response and its event counts. Their private edit link will stop working. This cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t("Keep response")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api(`/api/weddings/${id}/delete-response`, {
                    responseId: deleting,
                  });
                  setDeleting(null);
                  await refresh();
                  toast.success("Response deleted");
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? t("Deleting…") : t("Delete response")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
