import 'server-only'
import { eq, or, count, asc, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { contacts, invoices } from '../schema'

export type ContactInsert = typeof contacts.$inferInsert
export type ContactSelect = typeof contacts.$inferSelect

interface ListContactsOptions {
  search?: string
  limit?: number
  offset?: number
}

/**
 * List contacts with optional umlaut-tolerant, case-insensitive search.
 * Uses unaccent() if available, falls back to ilike for compatibility.
 */
export async function listContacts(opts: ListContactsOptions = {}): Promise<ContactSelect[]> {
  const db = getDb()
  const { search, limit = 50, offset = 0 } = opts

  if (search && search.trim()) {
    const q = `%${search.trim()}%`
    return db
      .select()
      .from(contacts)
      .where(
        or(
          sql`unaccent(${contacts.firmenname}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.nachname}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.ansprechperson}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.ort}) ilike unaccent(${q})`
        )
      )
      .orderBy(asc(contacts.firmenname))
      .limit(limit)
      .offset(offset)
  }

  return db
    .select()
    .from(contacts)
    .orderBy(asc(contacts.firmenname))
    .limit(limit)
    .offset(offset)
}

export async function countContacts(opts: { search?: string } = {}): Promise<number> {
  const db = getDb()
  const { search } = opts

  if (search && search.trim()) {
    const q = `%${search.trim()}%`
    const result = await db
      .select({ value: count() })
      .from(contacts)
      .where(
        or(
          sql`unaccent(${contacts.firmenname}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.nachname}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.ansprechperson}) ilike unaccent(${q})`,
          sql`unaccent(${contacts.ort}) ilike unaccent(${q})`
        )
      )
    return result[0]?.value ?? 0
  }

  const result = await db.select({ value: count() }).from(contacts)
  return result[0]?.value ?? 0
}

export async function getContact(id: string): Promise<ContactSelect | undefined> {
  const db = getDb()
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1)
  return result[0]
}

export async function createContact(data: Omit<ContactInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactSelect> {
  const db = getDb()
  const result = await db.insert(contacts).values(data).returning()
  return result[0]
}

export async function updateContact(
  id: string,
  data: Partial<Omit<ContactInsert, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ContactSelect | undefined> {
  const db = getDb()
  const result = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning()
  return result[0]
}

/**
 * Delete a contact. Invoices referencing this contact will have contactId set to NULL (ON DELETE SET NULL).
 * Returns the count of invoices that were affected (contactId set to NULL).
 */
export async function deleteContact(id: string): Promise<{ affectedInvoices: number }> {
  const db = getDb()
  
  // Count invoices that will be affected
  const affected = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.contactId, id))
  const affectedInvoices = affected[0]?.value ?? 0

  await db.delete(contacts).where(eq(contacts.id, id))
  return { affectedInvoices }
}
