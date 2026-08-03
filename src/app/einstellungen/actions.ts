'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSettings, updateSettings } from '@/lib/db/queries/settings'
import { storeLogo, deleteBlob, getSignedUrl } from '@/lib/storage/blob'

export async function updateSettingsAction(formData: FormData) {
  try {
    const data: Record<string, string> = {}
    const textFields = ['vereinsname','strasse','plz','ort','zvrZahl','bankname','iban','bic','kleinunternehmerHinweis','sig1Name','sig1Rolle','sig2Name','sig2Rolle']
    for (const field of textFields) {
      const val = formData.get(field)
      if (typeof val === 'string') data[field] = val
    }
    // Handle logo upload
    const logoFile = formData.get('logo') as File | null
    if (logoFile && logoFile.size > 0) {
      const current = await getSettings()
      const bytes = Buffer.from(await logoFile.arrayBuffer())
      const { path } = await storeLogo(bytes, logoFile.name, logoFile.type)
      data['logoBlobUrl'] = path
      // Delete old logo if it exists
      if (current.logoBlobUrl) {
        await deleteBlob('logos', current.logoBlobUrl).catch(() => {})
      }
    }
    await updateSettings(data)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  revalidatePath('/einstellungen')
  redirect('/einstellungen?success=1')
}

export async function updateCounterAction(formData: FormData) {
  const jahr = parseInt(formData.get('jahr') as string)
  const nextNumber = parseInt(formData.get('nextNumber') as string)
  if (isNaN(jahr) || isNaN(nextNumber) || nextNumber < 1) {
    return { success: false, error: 'Ungültige Nummer' }
  }
  const { getDb } = await import('@/lib/db/client')
  const { sql } = await import('drizzle-orm')
  const db = getDb()
  await db.execute(sql`
    INSERT INTO invoice_counters (jahr, last_number) VALUES (${jahr}, ${nextNumber - 1})
    ON CONFLICT (jahr) DO UPDATE SET last_number = ${nextNumber - 1}
  `)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/einstellungen')
  return { success: true }
}
