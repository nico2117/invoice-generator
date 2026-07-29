export const maxDuration = 60
export const runtime = 'nodejs'

import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { parseInvoiceCsv, type ParsedRow } from '@/lib/core/csv'
import { buildInvoiceFilename } from '@/lib/core/filename'
import { deriveAnredeGruss, formatCurrency, parseGermanNumber } from '@/lib/core/formatting'
import { fillTemplate } from '@/lib/core/template-engine'
import { getDb } from '@/lib/db/client'
import { allocateNumber } from '@/lib/db/queries/numbering'
import { assertSettingsComplete, getSettings, getSettingsSnapshot } from '@/lib/db/queries/settings'
import { invoices } from '@/lib/db/schema'
import { buildDocumentHtml } from '@/lib/render/html'
import { renderPdfBatch } from '@/lib/render/pdf'
import { fetchLogo, storePdf } from '@/lib/storage/blob'
import { getTemplate } from '@/lib/templates/registry'
import type { TemplateSchema } from '@/lib/templates/types'

const MAX_BATCH = 50

type SettingsSnapshot = Awaited<ReturnType<typeof getSettingsSnapshot>>
type HtmlSettings = {
  vereinsname: string
  strasse: string
  plz: string
  ort: string
  zvrZahl: string
  sig1Name: string
  sig1Rolle: string
  sig2Name: string
  sig2Rolle: string
  bankname: string
  iban: string
  bic: string
  kleinunternehmerHinweis: string
}

export async function POST(req: NextRequest) {
  try {
    await assertSettingsComplete()

    const formData = await req.formData()
    const templateId = formData.get('templateId')
    const file = formData.get('file')

    if (typeof templateId !== 'string' || !(file instanceof File)) {
      return NextResponse.json({ error: 'templateId and file required' }, { status: 400 })
    }

    const schema = getTemplate(templateId)
    if (!schema) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

    const buf = Buffer.from(await file.arrayBuffer())
    if (countCsvDataRows(buf) > MAX_BATCH) {
      return NextResponse.json({ error: `Maximale Stapelgröße: ${MAX_BATCH} Zeilen` }, { status: 422 })
    }

    const { rows, errors } = parseInvoiceCsv(buf, schema)

    if (rows.length === 0) {
      return NextResponse.json({ errors, generated: 0 }, { status: 422 })
    }
    if (rows.length > MAX_BATCH) {
      return NextResponse.json({ error: `Maximale Stapelgröße: ${MAX_BATCH} Zeilen` }, { status: 422 })
    }

    const settingsSnapshot = await getSettingsSnapshot()
    const currentSettings = await getSettings()
    const logoDataUri = await loadLogoDataUri(currentSettings.logoBlobUrl)
    const templateMd = loadTemplateMarkdown(schema)
    const currentYear = new Date().getFullYear()

    const htmlStrings = rows.map((row) => {
      const filled = fillTemplate(templateMd, buildTemplateData(row, settingsSnapshot))
      return buildDocumentHtml({
        markdown: filled,
        settings: toHtmlSettings(settingsSnapshot),
        logoDataUri,
      })
    })

    const pdfBuffers = await renderPdfBatch(htmlStrings)
    const zip = new JSZip()
    const results: Array<{ filename: string; error?: string }> = []
    const db = getDb()

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      const pdfBuf = pdfBuffers[index]

      try {
        if (!pdfBuf) throw new Error('PDF konnte nicht erzeugt werden')

        const empfaengerName = String(row.firmenname || row.nachname || 'Rechnung')
        const tempFilename = buildInvoiceFilename({ jahr: currentYear, nummer: 0, empfaenger: empfaengerName })
        const { path: pdfPath, sha256 } = await storePdf(pdfBuf, tempFilename)
        const invoiceId = randomUUID()
        let rechnungsnummer = 0
        let pdfFilename = tempFilename

        await db.transaction(async (tx) => {
          rechnungsnummer = await allocateNumber(currentYear, undefined, tx)
          pdfFilename = buildInvoiceFilename({ jahr: currentYear, nummer: rechnungsnummer, empfaenger: empfaengerName })
          await tx.insert(invoices).values({
            id: invoiceId,
            jahr: currentYear,
            rechnungsnummer,
            templateId: schema.id,
            contactId: null,
            empfaengerSnapshot: {
              firmenname: row.firmenname,
              anrede: row.anrede,
              nachname: row.nachname,
              strasse: row.strasse,
              hausnummer: row.hausnummer,
              plz: row.plz,
              ort: row.ort,
            },
            formData: row,
            settingsSnapshot: { verein: settingsSnapshot.verein, bank: settingsSnapshot.bank },
            betragGesamt: String(extractBetragGesamt(row)),
            pdfBlobUrl: pdfPath,
            pdfFilename,
            pdfSha256: sha256,
          })
        })

        zip.file(pdfFilename, pdfBuf)
        results.push({ filename: pdfFilename })
      } catch (err) {
        results.push({ filename: `zeile-${index + 2}`, error: err instanceof Error ? err.message : 'Unbekannter Fehler' })
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const zipFilename = `Rechnungen_${currentYear}_${timestamp}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'X-Results': JSON.stringify(results),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import fehlgeschlagen' }, { status: 500 })
  }
}

function loadTemplateMarkdown(schema: TemplateSchema): string {
  const templatePath = join(process.cwd(), 'src', 'lib', 'templates', schema.markdownFile)
  return readFileSync(templatePath, 'utf-8')
}

async function loadLogoDataUri(logoBlobUrl: string | null): Promise<string | null> {
  if (!logoBlobUrl) return null

  try {
    const logoBytes = await fetchLogo(logoBlobUrl)
    const contentType = logoBlobUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
    return `data:${contentType};base64,${logoBytes.toString('base64')}`
  } catch {
    return null
  }
}

function buildTemplateData(row: ParsedRow, settingsSnapshot: SettingsSnapshot): Record<string, unknown> {
  const data: Record<string, unknown> = {
    ...row,
    anrede_gruss: deriveAnredeGruss(row.anrede ?? ''),
    verein: settingsSnapshot.verein,
    bank: settingsSnapshot.bank,
  }

  for (const [key, value] of Object.entries(row)) {
    if (isCurrencyLikeField(key) && value.trim()) {
      data[key] = formatCurrency(parseFlexibleNumber(value))
    }
  }

  return data
}

function toHtmlSettings(settingsSnapshot: SettingsSnapshot): HtmlSettings {
  const { verein, bank } = settingsSnapshot
  return {
    vereinsname: verein.name,
    strasse: verein.strasse,
    plz: verein.plz,
    ort: verein.ort,
    zvrZahl: verein.zvrZahl,
    sig1Name: verein.sig1Name,
    sig1Rolle: verein.sig1Rolle,
    sig2Name: verein.sig2Name,
    sig2Rolle: verein.sig2Rolle,
    bankname: bank.name,
    iban: bank.iban,
    bic: bank.bic,
    kleinunternehmerHinweis: verein.kleinunternehmerHinweis,
  }
}

function extractBetragGesamt(row: ParsedRow): number {
  if (row.betrag) return parseFlexibleNumber(row.betrag)
  if (row.gesamtbetrag) return parseFlexibleNumber(row.gesamtbetrag)
  return 0
}

function parseFlexibleNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  try {
    return parseGermanNumber(value)
  } catch {
    return 0
  }
}

function isCurrencyLikeField(field: string): boolean {
  return ['betrag', 'einzelpreis', 'gesamtbetrag'].includes(field.toLowerCase())
}

function countCsvDataRows(buf: Buffer): number {
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    text = new TextDecoder('windows-1252').decode(buf)
  }
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

  return text
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .length
}
