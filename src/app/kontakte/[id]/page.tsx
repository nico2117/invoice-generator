import { notFound } from 'next/navigation'
import { eq, count } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { invoices } from '@/lib/db/schema'
import { getContact } from '@/lib/db/queries/contacts'
import { EditContactForm } from './EditForm'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const contact = await getContact(id)
  if (!contact) {
    notFound()
  }

  const db = getDb()
  const affected = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.contactId, id))
    
  const affectedInvoicesCount = affected[0]?.value ?? 0

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kontakt bearbeiten</h1>
      <EditContactForm contact={contact} affectedInvoices={affectedInvoicesCount} />
    </div>
  )
}
