import { NextResponse } from 'next/server'
import { getTemplate } from '@/lib/templates/registry'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const templateId = url.searchParams.get('template')
  if (!templateId) return NextResponse.json({ error: 'template required' }, { status: 400 })

  const schema = getTemplate(templateId)
  if (!schema) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

  const fields = schema.fields
    .filter((field) => field.type !== 'line-items')
    .map((field) => field.name)

  const header = fields.join(';')
  const sampleRow = fields.map((field) => {
    if (field === 'anrede') return 'Herrn'
    if (field === 'datum') return new Date().toLocaleDateString('de-AT')
    if (field === 'jahr') return new Date().getFullYear().toString()
    if (field === 'betrag' || field === 'einzelpreis') return '100,00'
    return ''
  }).join(';')

  const csv = `${header}\n${sampleRow}\n`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="muster-${templateId}.csv"`,
    },
  })
}
