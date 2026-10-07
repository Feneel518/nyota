import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/site";
import { env } from "@/server/env";
const copy: Record<string, { title: string; sections: [string, string][] }> = {
  privacy: {
    title: "Your celebration. Your privacy.",
    sections: [
      [
        "What is public",
        "Anyone with a published invitation link can view the names, event information, photos, and host contacts you choose to publish. Invitations are excluded from search indexing, but a shared link is not a password.",
      ],
      [
        "What stays private",
        "Draft invitations, original uploads, your account, payments, and the full guest response list are private. A guest’s private edit link lets its holder edit only that response. Keep those links private.",
      ],
      [
        "The information we use",
        "We use your account email to sign you in and send essential service notices. Guests provide a group name, attendance choices, event headcounts, and an optional note. No guest phone number or email is required. Minimal event records help us understand invitation usage; they do not include guest names, notes, or invitation text.",
      ],
      [
        "Gujarati translation",
        "When you request Gujarati translations, the selected English text is sent to MyMemory, an external translation service. You can review and edit the suggestions before saving. Ready wording templates and suggested function names are available without sending text to that service.",
      ],
      [
        "How long we keep it",
        "Hosting lasts six calendar months from first publication. After expiry, invitation pages, photos, and RSVP become unavailable publicly. You have 30 more days to export responses. Invitation content, photos, and responses are then removed. Inactive unpaid drafts without a payment intent are removed after 90 days. Necessary payment records are retained under the final launch retention policy.",
      ],
      [
        "Copies outside this service",
        "We cannot erase images already downloaded, screenshots, or social previews cached by another service. Updating or expiring an invitation stops future access through our service.",
      ],
      [
        "Before a public launch",
        "The final operator identity, financial-record retention period, and support address must be confirmed before accepting live payments. This build does not claim that review has happened.",
      ],
    ],
  },
  terms: {
    title: "A little clarity before the celebrations.",
    sections: [
      [
        "One invitation, one payment",
        "The checkout shows the final configured INR total for one invitation. Creating a draft and previewing it is free. Payment reserves the reviewed version and publishes only after server verification. If payment succeeds but publishing is delayed, you do not need to pay again.",
      ],
      [
        "Six calendar months",
        "Your hosting begins at first publication and ends six calendar months later, at the displayed time in Asia/Kolkata. The exact expiry and 30-day export deadline appear in your dashboard. You can publish changes during hosting without changing your link. Renewals and custom domains are not included.",
      ],
      [
        "Your content",
        "Use photos and wording that you have permission to share. Check dates, addresses, directions, translations, and public contact choices before publishing. You decide who receives the link.",
      ],
      [
        "Changes and responses",
        "Draft edits stay private until you publish updates. RSVP totals are per event. A private edit link allows its holder to change that guest response until expiry. Deleting a response is permanent.",
      ],
      [
        "Refunds and payment issues",
        "Contact support for duplicate charges, payment errors, and refund requests, quoting your order reference. Refunds are handled manually through the payment provider. Final eligibility, tax treatment, operator identity, and statutory wording require review before live sales; local test payments charge no money.",
      ],
      [
        "Service availability",
        "We provide recovery procedures for failed publication and processing jobs. A public launch requires verified service accounts, backups, monitoring, and tested recovery. External messaging apps may cache previews beyond invitation expiry.",
      ],
    ],
  },
  support: {
    title: "A helping hand, when you need one.",
    sections: [
      [
        "Payment or publishing",
        "Include the order reference shown in your checkout, the invitation link, and a short description of the issue. Never send payment card details, passwords, or private RSVP edit links.",
      ],
      [
        "A detail needs changing",
        "Open your invitation from the dashboard, edit the details, and select Publish updates. Changes keep the same public link.",
      ],
      [
        "A guest needs help",
        "Guests can open Invitation details directly without finishing the story or enabling sound. Their private response link is the only way to retrieve and edit their response without the owner’s help.",
      ],
    ],
  },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  return { title: copy[(await params).policy]?.title || "Page not found" };
}
export default async function Policy({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy } = await params;
  const page = copy[policy];
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="prose-page">
        <h1>{page.title}</h1>
        {page.sections.map(([title, text]) => (
          <section key={title} className="flex flex-col gap-3">
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        {env().SUPPORT_EMAIL ? (
          <p>
            Contact:{" "}
            <a className="underline" href={`mailto:${env().SUPPORT_EMAIL}`}>
              {env().SUPPORT_EMAIL}
            </a>
          </p>
        ) : (
          <p className="small-note">
            This is a development build. The operator’s support address has not
            been configured. Please contact the person who provided this build.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
