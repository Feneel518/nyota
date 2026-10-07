import Link from "next/link";
import { Ornament } from "./illustration";
import { Button } from "./ui/button";
import { brand } from "@/lib/brand";
export function Unavailable() {
  return (
    <main id="main" className="prose-page items-center text-center">
      <Ornament className="w-32" />
      <h1>This invitation is unavailable.</h1>
      <p>
        Its hosting period may have ended, or the link may have changed. Please
        check with your hosts.
      </p>
      <Button variant="outline" asChild>
        <Link href={brand.url}>Nyota</Link>
      </Button>
    </main>
  );
}
