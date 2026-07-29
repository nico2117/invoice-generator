export const maxDuration = 60
export const runtime = 'nodejs'

import { notFound } from 'next/navigation'
import { getTemplate } from '@/lib/templates/registry'
import { assertSettingsComplete } from '@/lib/db/queries/settings'
import { peekNextNumber } from '@/lib/db/queries/numbering'
import { getContact } from '@/lib/db/queries/contacts'
import { formatCurrency, formatDate } from '@/lib/core/formatting'
import { InvoiceCreationClient } from './InvoiceCreationClient'
import type { FormValues } from '@/components/form/types'
import Link from 'next/link'

interface Props {
  params: Promise<{ template: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RechnungTemplatePage({ params, searchParams }: Props) {
  const { template } = await params
  const schema = getTemplate(template)
  if (!schema) notFound()

  // Check settings but show a banner instead of throwing
  let settingsWarning: string | null = null
  try {
    await assertSettingsComplete()
  } catch (e) {
    settingsWarning = (e as Error).message
  }

  const resolvedSearchParams = await searchParams
  const kontaktParam = resolvedSearchParams.kontakt
  const contactId = typeof kontaktParam === 'string' ? kontaktParam : null
  const contact = contactId ? await getContact(contactId) : undefined
  const currentYear = new Date().getFullYear()
  const nextNumber = await peekNextNumber(currentYear)

  const initialValues: FormValues = {
    datum: formatDate(new Date()),
    jahr: currentYear,
    rechnungsnummer: nextNumber,
    ...Object.fromEntries(schema.fields
      .filter((field) => field.defaultValue !== undefined)
      .map((field) => [field.name, field.defaultValue])),
  }

  if (contact) {
    Object.assign(initialValues, {
      firmenname: contact.firmenname,
      anrede: contact.anrede,
      titel: contact.titel ?? '',
      ansprechperson: contact.ansprechperson ?? '',
      nachname: contact.nachname,
      strasse: contact.strasse,
      hausnummer: contact.hausnummer,
      plz: contact.plz,
      ort: contact.ort,
    })
  }

  if (schema.id === 'freie-rechnung') {
    initialValues.positionen ??= [{ beschreibung: '', menge: 1, einzelpreis: formatCurrency(0) }]
  }

  return (
    <div>
      {settingsWarning && (
        <div className="mb-4 rounded border border-yellow-400 bg-yellow-50 p-4 text-yellow-900">
          <strong>Vereinsdaten unvollständig:</strong> {settingsWarning.replace('Vereinsdaten unvollständig: ', '')}{' '}
          Bitte zuerst die{' '}
          <Link href="/einstellungen" className="underline font-semibold">
            Vereinsdaten
          </Link>{' '}
          ausfüllen, bevor Sie eine Rechnung erstellen.
        </div>
      )}
      <InvoiceCreationClient
        schema={schema}
        initialValues={initialValues}
        contactId={contact?.id ?? null}
        initialRechnungsnummer={nextNumber}
        settingsComplete={!settingsWarning}
      />
    </div>
  )
}
