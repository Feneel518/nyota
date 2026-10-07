import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Heart,
  Languages,
  Leaf,
  MousePointer2,
  Sparkles,
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
export default function Home() {
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(env().PRICE_PAISE / 100);
  return (
    <>
      <div className="wine-stage">
        <SiteHeader />
        <main id="main">
          <section className="container-wide hero-grid">
            <div className="hero-copy">
              <h1>A wedding invitation worth exploring.</h1>
              <p>
                Your story. Your celebrations. A little world of your own,
                shared in one beautiful link.
              </p>
              <div className="hero-actions">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sign-in">
                    Create your invitation
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </Button>
                <span className="hero-note">
                  Make it yours for free. Pay when you publish.
                </span>
              </div>
            </div>
            <div>
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
                <Sparkles size={14} aria-hidden="true" />A fictional couple. A
                real invitation experience.
              </p>
            </div>
          </section>
        </main>
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
          <h2>
            Find your kind
            <br />
            of beautiful.
          </h2>
          <p>
            Six illustrated worlds, each with a character of its own. The same
            feeling: unmistakably you.
          </p>
        </div>
        <div className="theme-gallery">
          {themes.map((theme) => (
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
      </section>
      <section className="how-section section-pad">
        <div className="container-wide how-grid">
          <div className="how-intro">
            <h2>From “we’re getting married” to “you’re invited.”</h2>
            <p>
              A few thoughtful details. An invitation that feels entirely your
              own.
            </p>
            <Button variant="outline" asChild>
              <Link href="/demo">Try the guest experience</Link>
            </Button>
          </div>
          <div>
            {[
              [
                "Make it yours",
                "Choose your world, dress your characters, and add a favourite photo or two.",
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
            Your invitation deserves your attention.
            <br />A subscription doesn’t.
          </p>
          <Ornament className="w-32 text-muted-foreground" />
        </div>
        <div className="price-panel">
          <p>Your complete wedding invitation</p>
          <div className="price">{price}</div>
          <p className="small-note">
            One-time total · six calendar months of hosting
          </p>
          <ul>
            {[
              "Your choice of all six illustrated themes",
              "Five scenes, photos, and character personalisation",
              "English and Gujarati, included",
              "Up to ten events with directions",
              "Private RSVPs, event counts, and CSV export",
              "A permanent link, QR code, and edits during hosting",
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
            Hosting starts when your invitation is first published. Preview
            before you pay. Your exact expiry is shown at checkout.
          </p>
        </div>
      </section>
      <section className="container-wide section-pad faq-section">
        <h2>
          A few things
          <br />
          you might wonder.
        </h2>
        <Accordion type="single" collapsible>
          {[
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
              "No. You enter your own English and Gujarati wording. If a translation is missing, guests see the wording in your default language.",
            ],
          ].map(([q, a], i) => (
            <AccordionItem value={String(i)} key={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <SiteFooter />
    </>
  );
}
