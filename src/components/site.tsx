import Link from "next/link";
import { Button } from "@/components/ui/button";
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 44V22C3 10 12 4 20 2c8 2 17 8 17 20v22H3Z"
        stroke="currentColor"
      />
      <path
        d="M10 34V17l20 17V17M10 17h5m10 17h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="m20 7 2 3-2 3-2-3Z" fill="currentColor" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Nyota home">
      <BrandMark className="nyota-mark" />
      <span>
        nyota<span className="brand-dot">.</span>
      </span>
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
