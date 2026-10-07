"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="prose-page">
      <h1>We couldn’t open that page.</h1>
      <p>Your saved work is safe. Check your connection and try again.</p>
      <Button onClick={reset}>Try again</Button>
      <Link href="/support">Contact support</Link>
    </main>
  );
}
