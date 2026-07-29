import { pgTable, uuid, text, integer, numeric, jsonb, timestamp, check, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  firmenname: text('firmenname').notNull(),
  anrede: text('anrede').notNull(),  // 'Herrn' | 'Frau'
  titel: text('titel'),
  ansprechperson: text('ansprechperson'),
  nachname: text('nachname').notNull(),
  strasse: text('strasse').notNull(),
  hausnummer: text('hausnummer').notNull(),
  plz: text('plz').notNull(),
  ort: text('ort').notNull(),
  email: text('email'),
  notiz: text('notiz'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const settings = pgTable('settings', {
  id: integer('id').primaryKey(),
  vereinsname: text('vereinsname').notNull().default(''),
  strasse: text('strasse').notNull().default(''),
  plz: text('plz').notNull().default(''),
  ort: text('ort').notNull().default(''),
  zvrZahl: text('zvr_zahl').notNull().default(''),
  bankname: text('bankname').notNull().default(''),
  iban: text('iban').notNull().default(''),
  bic: text('bic').notNull().default(''),
  kleinunternehmerHinweis: text('kleinunternehmer_hinweis').notNull().default('Im Betrag ist keine Vorsteuer enthalten.'),
  logoBlobUrl: text('logo_blob_url'),
  sig1Name: text('sig1_name').notNull().default(''),
  sig1Rolle: text('sig1_rolle').notNull().default(''),
  sig2Name: text('sig2_name').notNull().default(''),
  sig2Rolle: text('sig2_rolle').notNull().default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  check('settings_single_row', sql`${table.id} = 1`),
])

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  jahr: integer('jahr').notNull(),
  rechnungsnummer: integer('rechnungsnummer').notNull(),
  templateId: text('template_id').notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  empfaengerSnapshot: jsonb('empfaenger_snapshot').notNull(),
  formData: jsonb('form_data').notNull(),
  settingsSnapshot: jsonb('settings_snapshot').notNull(),
  betragGesamt: numeric('betrag_gesamt', { precision: 12, scale: 2 }).notNull(),
  pdfBlobUrl: text('pdf_blob_url').notNull(),
  pdfFilename: text('pdf_filename').notNull(),
  pdfSha256: text('pdf_sha256').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('invoices_jahr_nummer_idx').on(table.jahr, table.rechnungsnummer),
  index('invoices_created_at_idx').on(table.createdAt),
  index('invoices_jahr_idx').on(table.jahr),
])

export const invoiceCounters = pgTable('invoice_counters', {
  jahr: integer('jahr').primaryKey(),
  lastNumber: integer('last_number').notNull().default(0),
})
