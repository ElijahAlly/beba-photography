import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * cinderella.photography schema
 * ------------------------------------------------------------------
 * Identity (photographers + clients) is rooted in mytrees.family —
 * we cache the user's mytrees userId here for joins and don't store
 * passwords. Auth always goes through the OAuth flow.
 *
 * Media files don't live here either. Uploads are forwarded to
 * photos.mytrees.family and we keep the returned `photosMediaId`
 * on shootMedia so we can render thumbnails, drive the transfer
 * flow, and surface them on a photographer's storefront.
 */

// Photographers — top-level studio identity. Each photographer gets
// a vanity subdomain (e.g. elijah.cinderella.photography).
export const photographers = pgTable('photographers', {
  id: serial('id').primaryKey(),
  mytreesUserId: uuid('mytrees_user_id').notNull(),       // canonical identity
  email: text('email').notNull(),
  studioName: text('studio_name').notNull(),
  subdomain: text('subdomain').notNull(),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('photographers_subdomain_idx').on(table.subdomain),
  uniqueIndex('photographers_mytrees_idx').on(table.mytreesUserId),
]);

// Clients — the people a photographer is shooting for. They may or
// may not have a mytrees account yet; if they do, link it so they
// can claim the media at transfer time.
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  photographerId: integer('photographer_id').notNull()
    .references(() => photographers.id, { onDelete: 'cascade' }),
  mytreesUserId: uuid('mytrees_user_id'),                  // null = not yet linked
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('clients_photographer_idx').on(table.photographerId),
  index('clients_mytrees_idx').on(table.mytreesUserId),
]);

export const shootStatusValues = [
  'booked',
  'in_progress',
  'delivered',     // photos uploaded, available to client preview
  'paid',          // payment cleared, ownership transferred
  'cancelled',
] as const;

export const shoots = pgTable('shoots', {
  id: serial('id').primaryKey(),
  photographerId: integer('photographer_id').notNull()
    .references(() => photographers.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  location: text('location'),
  status: text('status').notNull().default('booked'),  // one of shootStatusValues
  totalPriceCents: bigint('total_price_cents', { mode: 'number' }).notNull().default(0),
  // The advertised package this price was derived from (e.g. 'wedding').
  // Prices themselves live only in env config, never the DB.
  pricePackageId: text('price_package_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  // How the shoot was settled: 'stripe' | 'cash' | 'waived'.
  paymentMethod: text('payment_method'),
  amountPaidCents: bigint('amount_paid_cents', { mode: 'number' }).notNull().default(0),
  // Stripe references for reconciliation (null until an online payment starts).
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('shoots_photographer_idx').on(table.photographerId),
  index('shoots_client_idx').on(table.clientId),
  index('shoots_status_idx').on(table.status),
]);

// One row per uploaded asset, pointing at the canonical record on
// photos.mytrees.family. We only keep the bare minimum for browsing;
// the photos backend is the source of truth.
export const shootMedia = pgTable('shoot_media', {
  id: serial('id').primaryKey(),
  shootId: integer('shoot_id').notNull()
    .references(() => shoots.id, { onDelete: 'cascade' }),
  photosMediaId: integer('photos_media_id').notNull(),  // primary key on photos.mytrees.family
  filename: text('filename').notNull(),
  type: text('type').notNull(),                          // image | video | audio | document
  size: bigint('size', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  transferredAt: timestamp('transferred_at', { withTimezone: true }),
}, (table) => [
  index('shoot_media_shoot_idx').on(table.shootId),
  uniqueIndex('shoot_media_photos_idx').on(table.photosMediaId),
]);

// Cache of mytrees users we've encountered (photographer or client).
// Lets us join locally without a network round-trip on every request.
export const mytreesUsers = pgTable('mytrees_users', {
  id: uuid('id').primaryKey(),                           // mytrees authUsers.id
  email: text('email').notNull(),
  displayName: text('display_name'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('mytrees_users_email_idx').on(table.email),
]);
