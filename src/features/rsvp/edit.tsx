"use client";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { type GuestResponse } from "@/lib/domain";
import { type InvitationContent } from "@/lib/content";
import { RsvpForm } from "./form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
export function EditResponse() {
  const privateToken = useRef<string | null>(null);
  const [data, setData] = useState<
    | (GuestResponse & {
        version: number;
        slug: string;
        content: InvitationContent;
      })
    | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = (privateToken.current ??= location.hash.slice(1));
    history.replaceState(null, "", location.pathname);
    if (!token) {
      setTimeout(
        () =>
          setError(
            "Open the complete private edit link you received after responding.",
          ),
        0,
      );
      return;
    }
    api<
      GuestResponse & {
        version: number;
        slug: string;
        content: InvitationContent;
      }
    >("/api/rsvp/edit", { token })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  return (
    <main id="main" className="guest-details">
      <h1>Edit your response.</h1>
      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Private link unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <RsvpForm
          content={data.content}
          language={data.content.defaultLanguage}
          slug={data.slug}
          editing={data}
        />
      ) : (
        <Skeleton className="h-72 mt-8" />
      )}
    </main>
  );
}
