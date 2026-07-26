import { pgTable, uuid, varchar, text, timestamp, integer, customType, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { EMBEDDING_DIMENSION } from '../constants/index.js';

// ============================================================
// CUSTOM TYPE: pgvector
// ============================================================
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING_DIMENSION})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value) as number[];
  },
});

// ============================================================
// TABLE: users
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  encrypted_gemini_key: text('encrypted_gemini_key'),
  gemini_key_iv: varchar('gemini_key_iv', { length: 24 }),
  gemini_key_tag: varchar('gemini_key_tag', { length: 32 }),
  gemini_model: varchar('gemini_model', { length: 100 }),
  gemini_embedding_model: varchar('gemini_embedding_model', { length: 100 }),

  // Email Notification Settings (Retrofit)
  encrypted_resend_key: text('encrypted_resend_key'),
  resend_key_iv: varchar('resend_key_iv', { length: 32 }),
  resend_key_tag: varchar('resend_key_tag', { length: 32 }),
  notification_email: varchar('notification_email', { length: 255 }),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// TABLE: refresh_tokens
// ============================================================
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token_hash: varchar('token_hash', { length: 255 }).notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// TABLE: documents
// ============================================================
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  original_filename: varchar('original_filename', { length: 255 }).notNull(),
  file_url: text('file_url').notNull(),
  file_type: varchar('file_type', { length: 50 }).notNull(),
  file_size_bytes: integer('file_size_bytes').notNull(),
  content_text: text('content_text').notNull(),
  ai_summary: text('ai_summary'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// TABLE: document_chunks
// pgvector extension must be enabled on the Neon database
// ============================================================
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  document_id: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chunk_text: text('chunk_text').notNull(),
  embedding: vector('embedding').notNull(),
  chunk_index: integer('chunk_index').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  docIdIdx: index('dc_document_id_idx').on(table.document_id),
  userIdIdx: index('dc_user_id_idx').on(table.user_id),
}));

// ============================================================
// TABLE: contact_messages (Hidden Inbox)
// ============================================================
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sender_name: varchar('sender_name', { length: 255 }).notNull(),
  sender_email: varchar('sender_email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  ai_screening_passed: boolean('ai_screening_passed').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// TABLE: system_settings (Global Config)
// ============================================================
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  google_analytics_id: varchar('google_analytics_id', { length: 50 }),
  termly_uuid: varchar('termly_uuid', { length: 50 }),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// TABLE: platform_reviews (Global Customer Testimonials)
// ============================================================
export const platformReviews = pgTable('platform_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  profession: varchar('profession', { length: 255 }),
  rating: integer('rating').notNull().default(5),
  feedback: text('feedback').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// RELATIONS
// ============================================================
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  documents: many(documents),
  documentChunks: many(documentChunks),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.user_id],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.user_id],
    references: [users.id],
  }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.document_id],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentChunks.user_id],
    references: [users.id],
  }),
}));
