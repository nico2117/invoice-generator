'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SchemaForm } from '@/components/form/SchemaForm'
import type { FormValues } from '@/components/form/types'
import type { TemplateSchema } from '@/lib/templates/types'

interface Props {
  schema: TemplateSchema
  initialValues: FormValues
  contactId: string | null
  initialRechnungsnummer: number
}

type SubmitMode = 'preview' | 'create'

export function InvoiceCreationClient({ schema, initialValues, contactId, initialRechnungsnummer }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(initialValues)
  const [numberEdited, setNumberEdited] = useState(false)
  const [mode, setMode] = useState<SubmitMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const payload = useMemo(() => ({
    templateId: schema.id,
    formData: values,
    jahr: Number(values.jahr ?? new Date().getFullYear()),
    override: numberEdited ? Number(values.rechnungsnummer) : undefined,
    contactId,
  }), [contactId, numberEdited, schema.id, values])

  async function submit(nextMode: SubmitMode, submitValues = values) {
    setMode(nextMode)
    setError(null)

    const body = {
      ...payload,
      formData: submitValues,
      jahr: Number(submitValues.jahr ?? payload.jahr),
      override: numberEdited ? Number(submitValues.rechnungsnummer) : undefined,
    }

    try {
      const res = await fetch(nextMode === 'preview' ? '/api/rechnung/vorschau' : '/api/rechnung/erstellen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Die Rechnung konnte nicht verarbeitet werden.')
      }

      if (nextMode === 'preview') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return
      }

      const data = await res.json()
      router.push(`/archiv/${data.invoiceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setMode(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/rechnung/neu" className="text-sm text-blue-600 hover:underline">← Vorlage wechseln</Link>
        <h1 className="text-2xl font-bold mt-2">Neue Rechnung erstellen</h1>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <input type="hidden" name="rechnungsnummerEdited" value={numberEdited ? '1' : '0'} readOnly />
      <SchemaForm
        schema={schema}
        initialValues={initialValues}
        onValuesChange={(nextValues, changedField) => {
          setValues(nextValues)
          if (changedField === 'rechnungsnummer' && Number(nextValues.rechnungsnummer) !== initialRechnungsnummer) {
            setNumberEdited(true)
          }
        }}
        onSubmit={(nextValues) => submit('create', nextValues)}
        actions={(
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              data-rechnungsnummer-edited={numberEdited}
              disabled={mode !== null}
              onClick={() => submit('preview')}
              className="w-full rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
            >
              {mode === 'preview' ? 'Vorschau wird erstellt…' : 'Vorschau'}
            </button>
            <button
              type="submit"
              data-rechnungsnummer-edited={numberEdited}
              disabled={mode !== null}
              className="w-full rounded-md bg-blue-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {mode === 'create' ? 'Rechnung wird erstellt…' : 'Rechnung erstellen'}
            </button>
          </div>
        )}
      />
    </div>
  )
}
