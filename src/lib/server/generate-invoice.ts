import 'server-only'

import { readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { fillTemplate } from '@/lib/core/template-engine'
import { buildInvoiceFilename } from '@/lib/core/filename'
import { deriveAnredeGruss, formatCurrency, parseGermanNumber } from '@/lib/core/formatting'
import { getDb } from '@/lib/db/client'
import { allocateNumber } from '@/lib/db/queries/numbering'
import { assertSettingsComplete, getSettings, getSettingsSnapshot } from '@/lib/db/queries/settings'
import { invoices } from '@/lib/db/schema'
import { buildDocumentHtml } from '@/lib/render/html'
import { renderPdf } from '@/lib/render/pdf'
import { fetchLogo, storePdf } from '@/lib/storage/blob'
import type { TemplateSchema } from '@/lib/templates/types'

interface GenerateInvoiceOptions {
  schema: TemplateSchema
  formData: Record<string, unknown>
  jahr: number
  override?: number
  contactId?: string | null
}

interface GenerateInvoiceResult {
  invoiceId: string
  pdfPath: string
  pdfFilename: string
  rechnungsnummer: number
}

type VereinSnapshot = Awaited<ReturnType<typeof getSettingsSnapshot>>['verein']

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

export async function generateInvoice(opts: GenerateInvoiceOptions): Promise<GenerateInvoiceResult> {
  await assertSettingsComplete()
  const settingsSnapshot = await getSettingsSnapshot()
  const currentSettings = await getSettings()

  const derivedData = computeDerivedValues(opts.schema, opts.formData)
  const templateData = {
    ...opts.formData,
    ...derivedData,
    verein: settingsSnapshot.verein,
    bank: settingsSnapshot.bank,
  }

  const templateMd = loadTemplateMarkdown(opts.schema)
  const filledMd = fillTemplate(templateMd, templateData as Record<string, unknown>)
  const logoDataUri = await loadLogoDataUri(currentSettings.logoBlobUrl)
  const html = buildDocumentHtml({
    markdown: filledMd,
    settings: toHtmlSettings(settingsSnapshot.verein, settingsSnapshot.bank),
    logoDataUri,
  })
  const pdfBuffer = await renderPdf(html)

  const empfaengerName = String(opts.formData.firmenname || 'Rechnung')
  const tempFilename = buildInvoiceFilename({ jahr: opts.jahr, nummer: 0, empfaenger: empfaengerName })
  const { path: pdfPath, sha256: pdfSha256 } = await storePdf(pdfBuffer, tempFilename)

  const db = getDb()
  const invoiceId = randomUUID()
  let rechnungsnummer = 0
  let pdfFilename = ''

  await db.transaction(async (tx) => {
    rechnungsnummer = await allocateNumber(opts.jahr, opts.override, tx)
    pdfFilename = buildInvoiceFilename({ jahr: opts.jahr, nummer: rechnungsnummer, empfaenger: empfaengerName })

    await tx.insert(invoices).values({
      id: invoiceId,
      jahr: opts.jahr,
      rechnungsnummer,
      templateId: opts.schema.id,
      contactId: opts.contactId ?? null,
      empfaengerSnapshot: {
        firmenname: opts.formData.firmenname,
        anrede: opts.formData.anrede,
        nachname: opts.formData.nachname,
        strasse: opts.formData.strasse,
        hausnummer: opts.formData.hausnummer,
        plz: opts.formData.plz,
        ort: opts.formData.ort,
      },
      formData: opts.formData,
      settingsSnapshot: { verein: settingsSnapshot.verein, bank: settingsSnapshot.bank },
      betragGesamt: String(extractBetragGesamt(opts.formData)),
      pdfBlobUrl: pdfPath,
      pdfFilename,
      pdfSha256,
    })
  })

  return { invoiceId, pdfPath, pdfFilename, rechnungsnummer }
}

export async function renderInvoicePreviewPdf(
  schema: TemplateSchema,
  formData: Record<string, unknown>
): Promise<Buffer> {
  await assertSettingsComplete()
  const settingsSnapshot = await getSettingsSnapshot()
  const currentSettings = await getSettings()
  const derivedData = computeDerivedValues(schema, formData)
  const filledMd = fillTemplate(loadTemplateMarkdown(schema), {
    ...formData,
    ...derivedData,
    verein: settingsSnapshot.verein,
    bank: settingsSnapshot.bank,
  })
  const logoDataUri = await loadLogoDataUri(currentSettings.logoBlobUrl)
  return renderPdf(buildDocumentHtml({
    markdown: filledMd,
    settings: toHtmlSettings(settingsSnapshot.verein, settingsSnapshot.bank),
    logoDataUri,
  }))
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

function toHtmlSettings(
  verein: VereinSnapshot,
  bank: Awaited<ReturnType<typeof getSettingsSnapshot>>['bank']
): HtmlSettings {
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

function computeDerivedValues(schema: TemplateSchema, formData: Record<string, unknown>): Record<string, unknown> {
  const derived: Record<string, unknown> = {}

  for (const d of schema.derived ?? []) {
    if (d.name === 'anrede_gruss') {
      derived.anrede_gruss = deriveAnredeGruss(String(formData.anrede ?? ''))
    }
  }

  if (Array.isArray(formData.positionen)) {
    let total = 0
    derived.positionen = formData.positionen.map((p) => {
      const position = p as Record<string, unknown>
      const menge = parseFlexibleNumber(position.menge)
      const einzelpreis = parseFlexibleNumber(position.einzelpreis)
      const summe = Math.round(menge * einzelpreis * 100) / 100
      total += summe
      return { ...position, summe: formatCurrency(summe) }
    })
    derived.gesamtbetrag = formatCurrency(Math.round(total * 100) / 100)
  }

  for (const field of schema.fields) {
    if (field.type === 'currency' && formData[field.name] !== undefined) {
      derived[field.name] = formatCurrency(parseFlexibleNumber(formData[field.name]))
    }
  }

  return derived
}

function extractBetragGesamt(formData: Record<string, unknown>): number {
  if (Array.isArray(formData.positionen)) {
    return formData.positionen.reduce((sum, p) => {
      const position = p as Record<string, unknown>
      const menge = parseFlexibleNumber(position.menge)
      const einzelpreis = parseFlexibleNumber(position.einzelpreis)
      return sum + Math.round(menge * einzelpreis * 100) / 100
    }, 0)
  }

  return parseFlexibleNumber(formData.betrag)
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
