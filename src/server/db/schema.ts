import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  primaryKey,
  check,
  foreignKey,
  bigint,
  unique,
} from "drizzle-orm/pg-core";
import type { InvitationContent } from "@/lib/content";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: time("created_at").defaultNow().notNull(),
  updatedAt: time("updated_at").defaultNow().notNull(),
});
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: time("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: time("access_token_expires_at"),
    refreshTokenExpiresAt: time("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: time("expires_at").notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const weddings = pgTable(
  "weddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    slug: text("slug").notNull().unique(),
    version: integer("version").default(1).notNull(),
    publishedRevisionId: uuid("published_revision_id"),
    firstPublishedAt: time("first_published_at"),
    expiresAt: time("expires_at"),
    purgeAt: time("purge_at"),
    purgedAt: time("purged_at"),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
  },
  (t) => [index("weddings_owner_updated_idx").on(t.ownerId, t.updatedAt)],
);
export const drafts = pgTable("wedding_drafts", {
  weddingId: uuid("wedding_id")
    .primaryKey()
    .references(() => weddings.id, { onDelete: "cascade" }),
  content: jsonb("content").$type<InvitationContent>().notNull(),
});
export const events = pgTable(
  "events",
  {
    id: uuid("id").notNull(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    title: jsonb("title").$type<{ en: string; gu: string }>().notNull(),
    archived: boolean("archived").default(false).notNull(),
  },
  (t) => [primaryKey({ columns: [t.weddingId, t.id] })],
);
export const revisions = pgTable(
  "invitation_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    draftVersion: integer("draft_version").notNull(),
    content: jsonb("content").$type<InvitationContent>().notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("revision_wedding_version_idx").on(t.weddingId, t.draftVersion),
  ],
);
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    objectKey: text("object_key").notNull().unique(),
    status: text("status")
      .$type<
        "pending" | "processing" | "ready" | "retained" | "rejected" | "deleted"
      >()
      .default("pending")
      .notNull(),
    type: text("type").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    error: text("error"),
    createdAt: time("created_at").defaultNow().notNull(),
  },
  (t) => [index("assets_wedding_idx").on(t.weddingId)],
);
export const revisionAssets = pgTable(
  "revision_assets",
  {
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => revisions.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
  },
  (t) => [primaryKey({ columns: [t.revisionId, t.assetId] })],
);
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    revisionId: uuid("revision_id").references(() => revisions.id, {
      onDelete: "set null",
    }),
    providerOrderId: text("provider_order_id").unique(),
    amount: integer("amount").notNull(),
    currency: text("currency").default("INR").notNull(),
    paymentState: text("payment_state")
      .$type<"creating" | "pending" | "captured" | "refunded" | "disputed">()
      .default("creating")
      .notNull(),
    fulfillment: text("fulfillment")
      .$type<"waiting" | "queued" | "published" | "reversed">()
      .default("waiting")
      .notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("one_purchase_per_wedding_idx").on(t.weddingId),
    check("order_positive_amount", sql`${t.amount} > 0`),
    check("order_inr", sql`${t.currency} = 'INR'`),
  ],
);
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  state: text("state").notNull(),
  amount: integer("amount").notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
});
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
});
export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    family: text("family").notNull(),
    attending: boolean("attending").notNull(),
    note: text("note").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    version: integer("version").default(1).notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("rsvp_wedding_idx").on(t.weddingId),
    unique("rsvp_wedding_id_idx").on(t.weddingId, t.id),
  ],
);
export const rsvpCounts = pgTable(
  "rsvp_event_responses",
  {
    weddingId: uuid("wedding_id").notNull(),
    rsvpId: uuid("rsvp_id").notNull(),
    eventId: uuid("event_id").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.rsvpId, t.eventId] }),
    foreignKey({
      columns: [t.weddingId, t.rsvpId],
      foreignColumns: [rsvps.weddingId, rsvps.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.weddingId, t.eventId],
      foreignColumns: [events.weddingId, events.id],
    }),
    check("headcount_range", sql`${t.count} BETWEEN 1 AND 20`),
  ],
);
export const idempotency = pgTable(
  "idempotency_records",
  {
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    result: jsonb("result").notNull(),
    expiresAt: time("expires_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.scope, t.key] })],
);
export const jobs = pgTable(
  "outbox_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, string>>().notNull(),
    state: text("state").default("pending").notNull(),
    dueAt: time("due_at").defaultNow().notNull(),
    leaseUntil: time("lease_until"),
    leaseToken: uuid("lease_token"),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    createdAt: time("created_at").defaultNow().notNull(),
  },
  (t) => [index("jobs_due_idx").on(t.state, t.dueAt)],
);
export const buckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: time("expires_at").notNull(),
});
export const analytics = pgTable(
  "analytics_events",
  {
    key: text("key").primaryKey(),
    weddingId: uuid("wedding_id").references(() => weddings.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
  },
  (t) => [index("analytics_wedding_kind_idx").on(t.weddingId, t.kind)],
);
export const audit = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  outcome: text("outcome").notNull(),
  createdAt: time("created_at").defaultNow().notNull(),
});
