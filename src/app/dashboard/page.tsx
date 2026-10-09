import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerText } from "@/components/owner-language";
import { currentUser } from "@/server/auth";
import { listWeddings } from "@/server/weddings";
import { Brand } from "@/components/site";
import { WeddingMotif } from "@/components/wedding-motif";
import { ArrowUpRight, CalendarDays, Heart, Mail } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewWedding, SignOut } from "@/features/weddings/dashboard";
import { eventDate, themeNames } from "@/lib/content";
export const metadata = { title: "Your invitations" };
export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const rows = await listWeddings(user.id);
  return (
    <div className="workspace nyota-dashboard">
      <header className="workspace-header">
        <Brand />
        <SignOut />
      </header>
      <main id="main">
        <div className="page-heading dashboard-welcome">
          <div>
            <h1>
              <OwnerText>Your celebrations.</OwnerText>
            </h1>
            <p>
              <OwnerText>
                A place for every detail, from the first draft to the final
                RSVP.
              </OwnerText>
            </p>
          </div>
          <NewWedding />
          <WeddingMotif className="dashboard-welcome-art" />
        </div>
        <div className="dashboard-overview">
          {[
            { Icon: Mail, value: rows.length, label: "Invitations" },
            {
              Icon: Heart,
              value: rows.filter(
                ({ wedding: w }) =>
                  w.firstPublishedAt && w.expiresAt && w.expiresAt > new Date(),
              ).length,
              label: "Live celebrations",
            },
            {
              Icon: CalendarDays,
              value: rows.filter(({ wedding: w }) => !w.firstPublishedAt)
                .length,
              label: "Drafts to make your own",
            },
          ].map(({ Icon, value, label }) => (
            <div key={label}>
              <Icon aria-hidden="true" />
              <strong>{value}</strong>
              <span>
                <OwnerText>{label}</OwnerText>
              </span>
            </div>
          ))}
        </div>
        {!rows.length ? (
          <Empty className="min-h-96">
            <WeddingMotif className="dashboard-empty-motif" kind="wedding" />
            <EmptyHeader>
              <EmptyTitle>
                <OwnerText>Your next chapter, beautifully invited.</OwnerText>
              </EmptyTitle>
              <EmptyDescription>
                <OwnerText>
                  Create your first invitation. Explore every theme and preview
                  your story before you pay.
                </OwnerText>
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <NewWedding />
              <Button variant="link" asChild>
                <Link href="/demo">
                  <OwnerText>Explore a finished invitation</OwnerText>
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="wedding-grid">
            {rows.map(({ wedding: w, content: c }) => {
              const expired = !!w.expiresAt && w.expiresAt <= new Date();
              const name = c.names
                .map((n) => n[c.defaultLanguage] || "Your name")
                .join(" & ");
              return (
                <Card key={w.id} className="dashboard-invitation-card">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{name}</CardTitle>
                      <Badge
                        variant={w.firstPublishedAt ? "default" : "secondary"}
                      >
                        <OwnerText>
                          {expired
                            ? "Expired"
                            : w.firstPublishedAt
                              ? "Published"
                              : "Draft"}
                        </OwnerText>
                      </Badge>
                    </div>
                    <CardDescription>
                      {w.expiresAt ? (
                        <>
                          <OwnerText>Hosting ends</OwnerText>{" "}
                          {eventDate(w.expiresAt.toISOString())}
                        </>
                      ) : (
                        <OwnerText>
                          Your private invitation in the making
                        </OwnerText>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="wedding-card-art invitation dashboard-card-stationery"
                      data-theme={c.theme}
                    >
                      <WeddingMotif kind="wedding" />
                      <p className="display">{name}</p>
                      <p>
                        {eventDate(
                          c.events.find((e) => e.id === c.mainEventId)?.start ||
                            "",
                          c.defaultLanguage,
                          false,
                        )}
                      </p>
                      <span>{themeNames[c.theme]}</span>
                    </div>
                    {expired && (
                      <p className="small-note mt-3">
                        <OwnerText>Export responses before</OwnerText>{" "}
                        {eventDate(w.purgeAt!.toISOString())}.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {!expired && (
                      <Button asChild>
                        <Link href={`/dashboard/${w.id}/edit`}>
                          <OwnerText>
                            {w.firstPublishedAt
                              ? "Edit invitation"
                              : "Continue creating"}
                          </OwnerText>
                          <ArrowUpRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    )}
                    {w.firstPublishedAt && (
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/${w.id}/responses`}>
                          <OwnerText>Responses</OwnerText>
                        </Link>
                      </Button>
                    )}
                    {w.firstPublishedAt && !expired && (
                      <Button variant="ghost" asChild>
                        <Link href={`/dashboard/${w.id}/checkout`}>Share</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        <div className="dashboard-help">
          <div>
            <h2>
              <OwnerText>A little inspiration?</OwnerText>
            </h2>
            <p>
              <OwnerText>
                Explore six invitation styles, made for the way you celebrate.
              </OwnerText>
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/demo">
              <OwnerText>Explore the demo</OwnerText>
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
