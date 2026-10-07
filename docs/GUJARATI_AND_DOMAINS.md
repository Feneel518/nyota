# Gujarati assistance and couple subdomains

The Couple and Functions steps include **Translate missing Gujarati**. Select English fields, request translations, edit the Gujarati suggestions, and apply them. Existing Gujarati content and English source text changed while suggestions are open are preserved. Translation does not publish changes. Enable Gujarati under Guest languages to offer it to guests.

Custom English text is sent to [MyMemory](https://mymemory.translated.net/doc/spec.php). Its anonymous API has a [daily character allowance](https://mymemory.translated.net/doc/usagelimits.php). Requests are authenticated, limited per owner, and bounded by a 45-second timeout. Template translations and suggested function names are provided locally. Partial failures are shown for each field; successful suggestions can still be applied. Review personal names and venue spelling.

Family lines and invitation wording each have six templates with English and Gujarati previews. Apply both languages or only the selected language, then edit the text. Mother names are optional, bilingual, and displayed with family blessings. Older invitations remain compatible. Functions can reuse the venue, address, and directions from an earlier function in both languages.

## Couple subdomains on Vercel

For `https://feneelnidharmi.yourdomain.com`, configure:

```dotenv
APP_URL=https://yourdomain.com
INVITATION_DOMAIN=yourdomain.com
```

1. Connect `yourdomain.com` and `*.yourdomain.com` to the same Vercel project.
2. Follow Vercel’s [wildcard domain and nameserver setup](https://vercel.com/docs/domains/working-with-domains). Vercel requires its nameservers for wildcard domains; preserve existing DNS records when changing providers.
3. Add the environment variables above to the Vercel project and redeploy.
4. Set the invitation’s link name to `feneelnidharmi` in Review, then publish it.

The public URL, QR code, sharing, publication email, and social preview use the couple subdomain. `/details`, `/social`, and private RSVP editing open on the same subdomain. RSVP and analytics accept only the matching invitation origin; owner APIs continue to require the main app origin. The main app hostname is never rewritten as an invitation.

In Review, entering a domain checks its availability. Choose **Save domain** to apply it. Names use 3–63 lowercase letters, numbers, or single hyphens between words; infrastructure names such as `www`, `api`, and `admin` are reserved. Availability is checked again when saving, and concurrent claims are protected by the database unique constraint. An unavailable name does not block editing the other steps.

Domains remain editable after an abandoned checkout and after payment. Changing a published domain takes effect immediately, preserves the invitation, responses, and hosting dates, and releases the old name. Previously shared links and QR codes must be replaced. The checkout order and its content snapshot remain unchanged; later content edits can be published once the invitation is live.

An owned domain is needed for wildcard couple subdomains. A generated Vercel deployment URL can host the app with the existing `/w/<slug>` links until the custom domain is connected. `INVITATION_DOMAIN` must be a hostname without `https://`, a port, or `*.`. You can use a separate suffix such as `invitations.yourdomain.com` if that wildcard is connected to the project.

For another host, configure wildcard DNS and HTTPS and forward the original Host header to this Next.js app. Leave `INVITATION_DOMAIN` empty to keep `/w/<slug>` URLs during local development.

## Browser regression check

`tests/e2e/invitation-assistance.spec.ts` covers bilingual templates, reviewed translations, saved mother names, copied venues, publication, mobile accessibility, subdomain RSVP, and social images. Use a local test instance at port 3001 with `EMAIL_ADAPTER=local`, `PAYMENT_ADAPTER=local`, and `INVITATION_DOMAIN=localhost` to test wildcard routing without live email or payment adapters. This is a test configuration; normal local development retains path links.
