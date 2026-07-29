'use server'
import { revalidatePath } from 'next/cache'
import { createContact, updateContact, deleteContact } from '@/lib/db/queries/contacts'

export async function createContactAction(formData: FormData) {
  try {
    const data = extractContactFields(formData)
    await createContact(data)
    revalidatePath('/kontakte')
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function updateContactAction(id: string, formData: FormData) {
  try {
    const data = extractContactFields(formData)
    await updateContact(id, data)
    revalidatePath('/kontakte')
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function deleteContactAction(id: string) {
  try {
    const result = await deleteContact(id)
    revalidatePath('/kontakte')
    return { success: true, affectedInvoices: result.affectedInvoices }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

function extractContactFields(formData: FormData) {
  const fields = ['firmenname','anrede','titel','ansprechperson','nachname','strasse','hausnummer','plz','ort','email','notiz']
  const data: Record<string, string | null> = {}
  for (const f of fields) {
    const v = formData.get(f)
    data[f] = typeof v === 'string' ? v : null
  }
  return data as { firmenname: string; anrede: string; nachname: string; strasse: string; hausnummer: string; plz: string; ort: string; titel?: string | null; ansprechperson?: string | null; email?: string | null; notiz?: string | null }
}
