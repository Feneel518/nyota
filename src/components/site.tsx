import Link from "next/link";
import { Button } from "@/components/ui/button";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Nyota home">
      <span>nyota</span>
    </Link>
  );
}
export function SiteHeader() {
  return (
    <header className="container-wide site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <Link className="desktop-link" href="/#features">
          Features
        </Link>
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
        <a href="https://www.nyotaa.app" className="small-note">
          www.nyotaa.app · Made for your kind of celebration.
        </a>
      </div>
    </footer>
  );
}
