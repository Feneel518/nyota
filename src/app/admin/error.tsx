"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="workspace py-16">
      <h1>Customer analytics could not load.</h1>
      <p className="my-4">
        Try again. If this continues, check the database connection.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
