import { NextRequest, NextResponse } from 'next/server'
import { getTemplate } from '@/lib/templates/registry'
import { renderInvoicePreviewPdf } from '@/lib/server/generate-invoice'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schema = getTemplate(String(body.templateId ?? ''))
    if (!schema) return NextResponse.json({ error: 'Unbekannte Vorlage' }, { status: 400 })

    const formData = normalizeFormData(body.formData)
    const pdf = await renderInvoicePreviewPdf(schema, formData)
    return new NextResponse(pdf as unknown as Blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="vorschau.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Vorschau fehlgeschlagen' }, { status: 500 })
  }
}

function normalizeFormData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}
