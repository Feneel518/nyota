import Link from "next/link";
import { Button } from "@/components/ui/button";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Wedding Adventure home">
      <span className="brand-mark" aria-hidden="true">
        w
      </span>
      <span>wedding adventure</span>
    </Link>
  );
}
export function SiteHeader() {
  return (
    <header className="container-wide site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <Link className="desktop-link" href="/#experience">
          The experience
        </Link>
        <Link className="desktop-link" href="/#pricing">
          Pricing
        </Link>
        <Button variant="outline" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </nav>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-wide footer-inner">
        <Brand />
        <div className="footer-links">
          <Link href="/demo">Explore the demo</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms & hosting</Link>
          <Link href="/support">Contact</Link>
        </div>
        <span className="small-note">Made for the moments that matter.</span>
      </div>
    </footer>
  );
}
