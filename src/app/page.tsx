import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Heart,
  Languages,
  Leaf,
  MousePointer2,
  Sparkles,
  Music2,
  Users,
  QrCode,
  MapPin,
} from "lucide-react";
import { Courtyard, Ornament } from "@/components/illustration";
import { SiteFooter, SiteHeader } from "@/components/site";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { themes, themeNames } from "@/lib/content";
import { themeDescriptions } from "@/lib/appearance";
import { env } from "@/server/env";
import { WeddingMotif } from "@/components/wedding-motif";
import { Badge } from "@/components/ui/badge";
import { brand } from "@/lib/brand";
import styles from "./home.module.css";
export const metadata = {
  title: "Gujarati & English Wedding Invitations with RSVP",
  description:
    "Create an animated Gujarati and English wedding invitation. Share every function, venue directions, and family RSVPs in one WhatsApp link. Preview free; pay once to publish.",
  alternates: { canonical: brand.url },
  openGraph: {
    title: "Your Gujarati wedding, beautifully invited.",
    description:
      "English & Gujarati. Every function, directions, and family RSVPs in one invitation. Preview free; pay once to publish.",
    url: brand.url,
    images: [
      {
        url: "/marketing-preview",
        width: 1200,
        height: 630,
        alt: "Nyota — Your Gujarati wedding, beautifully invited.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Gujarati wedding, beautifully invited.",
    description:
      "An animated wedding invitation in English and Gujarati. Preview free; pay once to publish.",
    images: ["/marketing-preview"],
  },
};
export default function Home() {
  const supportEmail = env().SUPPORT_EMAIL;
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(env().PRICE_PAISE / 100);
  return (
    <div className={styles.home}>
      <div className="wine-stage">
        <SiteHeader />
      </div>
      <main id="main">
        <div className="wine-stage">
          <section className="container-wide hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow">
                A little tradition. A little magic.
              </span>
              <h1>
                A wedding invitation <em>worth exploring.</em>
              </h1>
              <p>
                From the first Haldi to the last dance. Bring your traditions,
                your music, and your favourite people together in one beautiful
                link.
              </p>
              <div className="hero-actions">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sign-in">
                    Create your invitation
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Link href="/demo" className="hero-demo-link">
                  Explore a sample <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <span className="hero-note">
                Make it yours for free.{" "}
                <a href="#pricing">{price} once, when you publish.</a>
              </span>
            </div>
            <div className={styles.preview}>
              <div className="hero-invitation">
                <div className="hero-invitation-inner">
                  <p className="invitation-small">Together with our families</p>
                  <div className="display">Aarya & Dev</div>
                  <p className="invitation-small">14 February 2027 · Surat</p>
                  <Ornament className="ornament" />
                  <Courtyard className="courtyard" />
                  <div className="demo-action">
                    <Button asChild>
                      <Link href="/demo">
                        <MousePointer2 data-icon="inline-start" />
                        Step inside their story
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              <p className="sample-caption">
                <Sparkles size={14} aria-hidden="true" />
                Open a little world of celebration. No signup needed.
              </p>
            </div>
          </section>
        </div>
        <div className="feature-ribbon">
          <div className="container-wide">
            {[
              { Icon: Heart, text: "Personal to your love story" },
              { Icon: Languages, text: "English & ગુજરાતી" },
              { Icon: Leaf, text: "Thoughtfully paperless" },
              { Icon: Check, text: "Every celebration, one link" },
            ].map(({ Icon, text }) => (
              <div className="ribbon-item" key={text}>
                <Icon aria-hidden="true" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <section className="container-wide section-pad" id="experience">
          <div className="section-heading">
            <div>
              <span className={styles.sectionLabel}>
                The invitation collection
              </span>
              <h2>
                Find your kind
                <br />
                of beautiful.
              </h2>
            </div>
            <p>
              Six illustrated worlds, each with a character of its own. Choose
              the one that feels like you.
            </p>
          </div>
          <ThemeGallery items={themes} />
        </section>
        <section
          id="features"
          className="container-wide section-pad nyota-features"
        >
          <div className="section-heading">
            <h2>
              All the little details.
              <br />
              One beautiful Nyota.
            </h2>
            <p>
              An invitation your family will love opening. A guest list you will
              love managing.
            </p>
          </div>
          <div className="feature-showcase">
            <article className="showcase-ceremonies">
              <div>
                <h3>Every tradition gets its moment.</h3>
                <p>
                  Haldi, Mehendi, Sangeet, the wedding, and everything in
                  between. Give each celebration its own time, place, and
                  personality.
                </p>
              </div>
              <div className="mini-ceremonies" aria-hidden="true">
                {(["haldi", "mehendi", "sangeet"] as const).map((kind) => (
                  <div data-kind={kind} key={kind}>
                    <WeddingMotif kind={kind} />
                    <span>
                      {kind === "haldi"
                        ? "Haldi"
                        : kind === "mehendi"
                          ? "Mehendi"
                          : "Sangeet"}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/demo#details" className="feature-text-link">
                Explore the invitation <ArrowUpRight size={16} />
              </Link>
            </article>
            <article className="showcase-guests">
              <Users aria-hidden="true" />
              <h3>
                Less chasing.
                <br />
                More celebrating.
              </h3>
              <p>
                Private family RSVPs, a headcount for each event, and an export
                for your wedding planner.
              </p>
              <div
                className="sample-guest-list"
                aria-label="Example guest responses"
              >
                <div>
                  <span>Patel family</span>
                  <Badge variant="secondary">Attending · 4</Badge>
                </div>
                <div>
                  <span>Shah family</span>
                  <Badge variant="secondary">Attending · 3</Badge>
                </div>
                <div>
                  <span>Mehta family</span>
                  <Badge variant="outline">Declined</Badge>
                </div>
                <small>Illustrative guest list</small>
              </div>
            </article>
            <article className="showcase-language">
              <Languages aria-hidden="true" />
              <h3>
                Feels like home.
                <br />
                In both languages.
              </h3>
              <div className="language-sample">
                <span>You’re warmly invited</span>
                <span lang="gu">આપનું હાર્દિક સ્વાગત છે</span>
              </div>
              <p>
                English and Gujarati, with ready-to-personalise wording and
                translation assistance.
              </p>
            </article>
            <article className="showcase-music">
              <Music2 aria-hidden="true" />
              <h3>Set the mood.</h3>
              <div className="soundwave" aria-hidden="true">
                {[
                  16, 30, 42, 25, 48, 36, 22, 40, 52, 28, 38, 18, 32, 44, 24,
                ].map((height, i) => (
                  <span key={i} style={{ height }} />
                ))}
              </div>
              <p>
                Six original instrumentals. A gentle melody or a festive beat,
                played when your guests choose.
              </p>
              <span className="music-track-caption">
                Shaadi morning / Sitar serenade / Sangeet
              </span>
            </article>
            <article className="showcase-share">
              <QrCode aria-hidden="true" />
              <h3>One link. Everyone invited.</h3>
              <p>
                Share on WhatsApp, send a QR code, or copy your invitation link.
                Guests can RSVP without signing up.
              </p>
              <div className="sample-link">yourcelebration.nyotaa.app</div>
              <div className="share-detail">
                <MapPin size={15} />
                <span>Venue directions included</span>
              </div>
            </article>
          </div>
        </section>
        <section className="how-section section-pad">
          <div className="container-wide how-grid">
            <div className="how-intro">
              <h2>From “we’re getting married” to “you’re invited.”</h2>
              <p>
                Start with your names and celebrations. Make it yours, then see
                exactly what your guests will open before you pay.
              </p>
              <Button variant="outline" asChild>
                <Link href="/demo">Try the guest experience</Link>
              </Button>
            </div>
            <div>
              {[
                [
                  "Make it yours",
                  "Choose your theme, dress your characters, and add a favourite photo or two.",
                ],
                [
                  "Bring everyone together",
                  "Add your celebrations, venues, and a personal message. Preview it in English or Gujarati.",
                ],
                [
                  "Send a little joy",
                  "Publish once. Share your link or QR code. Keep every family’s response in one place.",
                ],
              ].map(([title, text], i) => (
                <div className="how-step" key={title}>
                  <span className="step-number">0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          className="container-wide section-pad pricing-section"
          id="pricing"
        >
          <div className="pricing-intro">
            <h2>
              One celebration.
              <br />
              One simple price.
            </h2>
            <p>
              All your celebrations, all the thoughtful details. One payment,
              six months of hosting, and no subscription.
            </p>
            <Ornament className="w-32 text-muted-foreground" />
            <Link href="/demo" className="feature-text-link">
              See what your guests will open{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="price-panel">
            <p>Your complete wedding invitation</p>
            <div className="price">{price}</div>
            <p className="small-note">
              One-time total · six calendar months of hosting
            </p>
            <ul>
              {[
                "All six illustrated themes, photos, and character personalisation",
                "English and Gujarati wording, with translation assistance",
                "Up to ten events with venue directions",
                "Private family RSVPs, per-event counts, and CSV export",
                "Six original music tracks",
                "WhatsApp sharing, a QR code, and edits during hosting",
              ].map((t) => (
                <li key={t}>
                  <Check aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full" asChild>
              <Link href="/sign-in">Start creating for free</Link>
            </Button>
            <p className="small-note mt-4">
              Preview before you pay. Hosting begins at first publication; your
              exact expiry is shown at checkout. No automatic renewal.
            </p>
            <Link href="/terms" className="small-note underline">
              Read hosting and payment terms
            </Link>
          </div>
        </section>
        {supportEmail && (
          <section
            className="container-wide setup-help section-pad"
            aria-labelledby="setup-help-title"
          >
            <div>
              <span className="small-note">A little help getting started</span>
              <h2 id="setup-help-title">
                Your invitation starts with a conversation.
              </h2>
              <p>
                Unsure about the wording or how to bring your functions
                together? Tell us where you’re stuck. Photographers and planners
                can also get in touch about using Nyota with their couples.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`mailto:${supportEmail}?subject=Help%20with%20my%20Nyota%20invitation`}
              >
                Ask about your invitation <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </section>
        )}
        <section className="container-wide section-pad faq-section">
          <h2>
            A few things
            <br />
            you might wonder.
          </h2>
          <Accordion type="single" collapsible>
            {[
              [
                "Can I try it before paying?",
                "Yes. Explore the sample invitation without signing up. Create a free account to save and personalise your own invitation, then preview it before paying to publish.",
              ],
              [
                "Do guests need an account or app?",
                "No. Guests open your link in their browser, view the celebrations, get directions, and RSVP without signing up.",
              ],
              [
                "Can guests skip the interactive story?",
                "Always. Invitation details, directions, and RSVP are available directly. Nobody needs to finish the adventure or turn on sound.",
              ],
              [
                "Can I change details after publishing?",
                "Yes. Edit your draft and select Publish updates. Your link stays the same, and guests see your latest published details.",
              ],
              [
                "What happens after six months?",
                "The invitation and RSVP close at the exact expiry time. You have another 30 days to export responses before invitation content and photos are deleted. Renewals are not included.",
              ],
              [
                "Who can see our invitation and responses?",
                "Anyone with the published link can view your invitation. Only your signed-in account can see all responses. Guests can edit their own response using a private link.",
              ],
              [
                "Do you translate our invitation automatically?",
                "You can write in English and Gujarati, start with our wording templates, or use translation assistance. Review the wording before publishing. Missing translations fall back to your invitation’s default language.",
              ],
            ].map(([q, a], i) => (
              <AccordionItem value={String(i)} key={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ThemeGallery({ items }: { items: readonly (typeof themes)[number][] }) {
  return (
    <div className="theme-gallery">
      {items.map((theme) => (
        <Link
          href={`/demo?theme=${theme}`}
          key={theme}
          className="theme-sample"
        >
          <div className="theme-sample-art" data-theme={theme}>
            <div className="theme-sample-paper">
              <div className="display">Aarya & Dev</div>
              <p>A celebration of togetherness</p>
              <Courtyard theme={theme} />
            </div>
          </div>
          <div className="theme-sample-label">
            <div>
              <h3>{themeNames[theme]}</h3>
              <p>{themeDescriptions[theme]}</p>
            </div>
            <ArrowUpRight size={20} aria-hidden="true" />
          </div>
        </Link>
      ))}
    </div>
  );
}
