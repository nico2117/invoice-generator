import { NextRequest, NextResponse } from 'next/server'
import { getTemplate } from '@/lib/templates/registry'
import { generateInvoice } from '@/lib/server/generate-invoice'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schema = getTemplate(String(body.templateId ?? ''))
    if (!schema) return NextResponse.json({ error: 'Unbekannte Vorlage' }, { status: 400 })

    const formData = normalizeFormData(body.formData)
    const jahr = toOptionalNumber(body.jahr) ?? toOptionalNumber(formData.jahr) ?? new Date().getFullYear()
    const override = toOptionalNumber(body.override)
    const contactId = typeof body.contactId === 'string' && body.contactId ? body.contactId : null
    const result = await generateInvoice({ schema, formData, jahr, override, contactId })

    return NextResponse.json({ invoiceId: result.invoiceId })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Rechnung konnte nicht erstellt werden' }, { status: 500 })
  }
}

function normalizeFormData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
