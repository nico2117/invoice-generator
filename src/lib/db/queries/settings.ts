import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { settings } from '../schema'
import { SETTINGS_PLACEHOLDER_KEYS } from '@/lib/templates/types'

export type SettingsSelect = typeof settings.$inferSelect

/**
 * Default seed — used on first run when no settings row exists.
 * User fills in IBAN/BIC/Straße via /einstellungen after first login.
 */
const DEFAULT_SETTINGS = {
  id: 1 as const,
  vereinsname: 'Burschenschaft Kirchbach',
  strasse: '',
  plz: '',
  ort: 'Kirchbach',
  zvrZahl: '946256229',
  bankname: '',
  iban: '',
  bic: '',
  kleinunternehmerHinweis: 'Im Betrag ist keine Vorsteuer enthalten.',
  logoBlobUrl: null,
  sig1Name: 'Patrick Eineter',
  sig1Rolle: 'Obmann',
  sig2Name: 'Nico Eineter',
  sig2Rolle: 'Kassier',
}

/**
 * Get the (single) settings row. Creates it from DEFAULT_SETTINGS if absent.
 * Idempotent — calling multiple times always returns the same row.
 */
export async function getSettings(): Promise<SettingsSelect> {
  const db = getDb()
  const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  if (result.length > 0) return result[0]

  const seeded = await db.insert(settings).values(DEFAULT_SETTINGS).returning()
  return seeded[0]
}

/**
 * Partial update. Sets updatedAt automatically.
 */
export async function updateSettings(
  data: Partial<Omit<SettingsSelect, 'id' | 'updatedAt'>>
): Promise<SettingsSelect> {
  const errors = validateSettingsUpdate(data)
  if (errors.length > 0) throw new Error(errors.join('; '))

  const db = getDb()
  await getSettings()
  const result = await db
    .update(settings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(settings.id, 1))
    .returning()
  return result[0]
}

/**
 * Returns settings as a plain object matching the {{verein.*}} and {{bank.*}}
 * placeholder paths used by templates. Shape must resolve every SETTINGS_PLACEHOLDER_KEYS entry.
 */
export async function getSettingsSnapshot(): Promise<{
  verein: {
    name: string; strasse: string; plz: string; ort: string; zvrZahl: string;
    kleinunternehmerHinweis: string; sig1Name: string; sig1Rolle: string;
    sig2Name: string; sig2Rolle: string;
  };
  bank: { name: string; iban: string; bic: string };
}> {
  void SETTINGS_PLACEHOLDER_KEYS
  const s = await getSettings()
  return {
    verein: {
      name: s.vereinsname,
      strasse: s.strasse,
      plz: s.plz,
      ort: s.ort,
      zvrZahl: s.zvrZahl,
      kleinunternehmerHinweis: s.kleinunternehmerHinweis,
      sig1Name: s.sig1Name,
      sig1Rolle: s.sig1Rolle,
      sig2Name: s.sig2Name,
      sig2Rolle: s.sig2Rolle,
    },
    bank: {
      name: s.bankname,
      iban: s.iban,
      bic: s.bic,
    },
  }
}

/**
 * Throws if any required settings field is empty.
 * Called before invoice generation to avoid blank-IBAN invoices.
 */
export async function assertSettingsComplete(): Promise<void> {
  const s = await getSettings()
  const missing: string[] = []
  if (!s.vereinsname) missing.push('Vereinsname')
  if (!s.iban) missing.push('IBAN')
  if (!s.bic) missing.push('BIC')
  if (!s.bankname) missing.push('Bankname')
  if (!s.ort) missing.push('Ort')
  if (!s.sig1Name) missing.push('Unterschrift 1 Name')
  if (!s.sig2Name) missing.push('Unterschrift 2 Name')
  if (missing.length > 0) {
    throw new Error(`Vereinsdaten unvollständig: ${missing.join(', ')} fehlt`)
  }
}

function validateSettingsUpdate(data: Partial<Omit<SettingsSelect, 'id' | 'updatedAt'>>): string[] {
  const errors: string[] = []
  if (data.iban !== undefined && data.iban !== '') {
    const ibanClean = data.iban.replace(/\s/g, '')
    if (!/^[A-Z]{2}\d{16,32}$/.test(ibanClean)) {
      errors.push('Ungültige IBAN (Format: AT + 18 Ziffern oder allgemeines IBAN-Format)')
    }
  }
  if (data.bic !== undefined && data.bic !== '') {
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(data.bic)) {
      errors.push('Ungültige BIC (8 oder 11 Zeichen)')
    }
  }
  if (data.plz !== undefined && data.plz !== '') {
    if (!/^\d{4}$/.test(data.plz)) {
      errors.push('Ungültige PLZ (4 Ziffern für Österreich)')
    }
  }
  return errors
}
