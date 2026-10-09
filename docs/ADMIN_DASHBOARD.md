# Customer analytics

Sign in as **feneelp@gmail.com** and open **/admin**, or use the Admin dashboard link on Your invitations. Access requires a verified email and a valid server-checked session. Other accounts cannot read the dashboard or export endpoint.

The overview covers all customers except the admin account. Search by name/email and choose a segment to filter the paginated customer table. Export this segment downloads all matching accounts as CSV, including accounts on other pages.

- **Paid customers:** at least one currently captured order.
- **Active in 30 days:** recorded sign-in, session refresh, invitation creation/edit, or checkout creation within 30 days. This is not a live online indicator.
- **Signed in, never bought:** recorded sign-in and no captured, refunded, or disputed purchase.
- **Unfinished checkout:** a creating/pending order and no purchase history. A pending payment may still complete; this does not establish abandonment or its cause.
- **Refunded / disputed:** at least one order in either state, even if another order is paid.
- **Captured revenue:** captured order amounts in INR, excluding refunded and disputed orders. This is not a settlement or profit report. Published counts include previously published invitations, even when expired.

Nyota currently sells invitations as one-time purchases; there is no recurring subscription status. Session creation now records `auth.sign_in` in the existing audit table, so no schema migration is required. Existing session timestamps supplement this history. Previously deleted sessions cannot be reconstructed. Recording failures log an operational error without blocking sign-in.

**Draft email** opens an editable personal follow-up. **Open in email app** opens a `mailto:` draft in the administrator's mail client. Review and send there. This dashboard does not send automatically, track delivery, collect marketing permission, or maintain unsubscribe/suppression records. Check those records before contacting customers. CSV is available for your existing email workflow.
