"use client";
import { useUiLanguage } from "@/components/owner-language";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Search,
  Trash2,
  RefreshCw,
  Users,
  Check,
  Mail,
  Eye,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import {
  type InvitationContent,
  eventDate,
  localizedText,
} from "@/lib/content";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/site";
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
  const { t, language } = useUiLanguage();
  const title = (value: { en: string; gu: string }) =>
    localizedText(value, language, content.defaultLanguage);
  const request = useRef(0);
  const [status, setStatus] = useState<"all" | "attending" | "declined">("all");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(initial),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const sequence = ++request.current;
    setLoading(true);
    try {
      const next = await api<Data>(
        `/api/weddings/${id}/responses?q=${encodeURIComponent(search)}&page=${page}&status=${status}`,
      );
      if (sequence !== request.current) return;
      if (page > 1 && !next.rows.length) {
        setPage(Math.max(1, Math.ceil(next.total / 25)));
        return;
      }
      setData(next);
      setError("");
    } catch (e) {
      if (sequence === request.current) setError(errorMessage(e));
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, [id, search, page, status]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 300);
    return () => {
      clearTimeout(timer);
      // This is a request generation counter, not a DOM ref. Invalidate work on unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      request.current++;
    };
  }, [refresh]);
  return (
    <main id="main" className="workspace responses-workspace pb-20">
      <header className="workspace-header">
        <Brand />
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/${id}/edit`}>{t("Edit invitation")}</Link>
        </Button>
      </header>
      <div className="page-heading">
        <div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft data-icon="inline-start" />
              {t("Your invitations")}
            </Link>
          </Button>
          <h1 className="mt-4">{t("Your guest book")}</h1>
          <p>
            {content.names.map(title).join(" & ")} —{" "}
            {t("Every response, all in one place.")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/weddings/${id}/export`}>
            <Download data-icon="inline-start" />
            {t("Export CSV")}
          </a>
        </Button>
      </div>
      <div className="response-metrics">
        {[
          { value: data.totals.responses, label: t("Responses"), icon: Mail },
          {
            value: data.totals.attending,
            label: t("Attending families"),
            icon: Users,
          },
          {
            value: data.totals.declines,
            label: t("Declines"),
            icon: CalendarDays,
          },
          { value: data.visits, label: t("Approximate visits"), icon: Eye },
        ].map(({ value, label, icon: Icon }) => (
          <div className="response-metric" key={label}>
            <div>
              <p>{label}</p>
              <Icon aria-hidden="true" />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="attendance-panel">
        <div className="attendance-heading">
          <div>
            <h2>{t("Celebration headcounts")}</h2>
            <p>{t("Confirmed people by event")}</p>
          </div>
          <Users aria-hidden="true" />
        </div>
        <div className="event-headcounts">
          {content.events.map((e) => (
            <div className="event-headcount" key={e.id}>
              <p className="small-note">
                {title(e.title)}
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
      </section>
      <section
        className="guest-book-panel"
        aria-label={t("Guest responses")}
        aria-busy={loading}
      >
        <div className="guest-book-heading">
          <h2>{t("Guest responses")}</h2>
          <Badge variant="outline">
            {data.total} {t("families")}
          </Badge>
        </div>
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
                request.current++;
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw
              data-icon="inline-start"
              className={loading ? "animate-spin" : undefined}
            />
            {t("Refresh responses")}
          </Button>
        </div>
        <div className="response-filters">
          <ToggleGroup
            type="single"
            variant="outline"
            value={status}
            aria-label={t("Filter responses")}
            onValueChange={(value) => {
              if (value) {
                request.current++;
                setStatus(value as typeof status);
                setPage(1);
              }
            }}
          >
            <ToggleGroupItem value="all">{t("All responses")}</ToggleGroupItem>
            <ToggleGroupItem value="attending">
              {t("Attending")}
            </ToggleGroupItem>
            <ToggleGroupItem value="declined">{t("Declined")}</ToggleGroupItem>
          </ToggleGroup>
          <span role="status" className="small-note">
            {loading
              ? t("Updating responses…")
              : `${data.total} ${t("responses")}`}
          </span>
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
                      {title(e.title)}
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
                    <TableCell aria-label={r.family}>
                      <div className="family-cell">
                        <span className="family-initial" aria-hidden="true">
                          {Array.from(r.family.trim())[0]}
                        </span>
                        <div>
                          <strong>{r.family}</strong>
                          <span>{eventDate(r.updatedAt, language, false)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.attending ? "secondary" : "outline"}>
                        {r.attending && <Check data-icon="inline-start" />}
                        {r.attending ? t("Attending") : t("Declined")}
                      </Badge>
                    </TableCell>
                    {content.events.map((e) => (
                      <TableCell key={e.id}>
                        {r.counts[e.id] ||
                          (r.attending ? t("No response") : "—")}
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
                {t("Page")} {page} {t("of")}{" "}
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
                {search || status !== "all"
                  ? t("No matching families")
                  : t("Good company is on its way.")}
              </EmptyTitle>
              <EmptyDescription>
                {search || status !== "all"
                  ? t("Try another name or change the attendance filter.")
                  : t(
                      "Share your invitation. Your first guest response will appear here.",
                    )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
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
              variant="destructive"
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
