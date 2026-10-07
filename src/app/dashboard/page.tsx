import Link from "next/link";
import { OwnerText } from "@/components/owner-language";
import { currentUser } from "@/server/auth";
import { listWeddings } from "@/server/weddings";
import { Brand } from "@/components/site";
import { Courtyard } from "@/components/illustration";
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
import { eventDate } from "@/lib/content";
export const metadata = { title: "Your invitations" };
export default async function Dashboard() {
  const user = (await currentUser())!;
  const rows = await listWeddings(user.id);
  return (
    <div className="workspace">
      <header className="workspace-header">
        <Brand />
        <SignOut />
      </header>
      <main id="main">
        <div className="page-heading">
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
        </div>
        {!rows.length ? (
          <Empty className="min-h-96">
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
                <Card key={w.id}>
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
                    <div className="wedding-card-art">
                      <Courtyard
                        theme={c.theme}
                        characters={c.characters}
                        outfits={c.outfits}
                      />
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
      </main>
    </div>
  );
}
