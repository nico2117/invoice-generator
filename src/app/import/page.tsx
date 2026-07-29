'use client'

import { useEffect, useMemo, useState } from 'react'
import { TEMPLATES } from '@/lib/templates/registry'
import type { FieldDef, TemplateSchema } from '@/lib/templates/types'

const MAX_BATCH = 50

type WizardStep = 1 | 2 | 3
type ParsedRow = Record<string, string>
type CsvError = { line: number; column: string; message: string }
type GenerationResult = { filename: string; error?: string }

export default function ImportPage() {
  const templates = useMemo(() => Object.values(TEMPLATES), [])
  const [step, setStep] = useState<WizardStep>(1)
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [validRows, setValidRows] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<CsvError[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('rechnungen.zip')
  const [results, setResults] = useState<GenerationResult[]>([])

  const selectedTemplate = TEMPLATES[templateId]
  const visibleFields = selectedTemplate?.fields.filter((field) => field.type !== 'line-items') ?? []

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

  async function validateFile() {
    setMessage(null)
    setValidRows([])
    setErrors([])
    setResults([])
    clearDownload()

    if (!selectedTemplate) {
      setMessage('Bitte eine Vorlage auswählen.')
      return
    }
    if (!file) {
      setMessage('Bitte eine CSV-Datei auswählen.')
      return
    }

    try {
      const text = await readCsvFile(file)
      const parsed = parseCsvForPreview(text, selectedTemplate)
      if (parsed.totalRows > MAX_BATCH) {
        setMessage(`Maximale Stapelgröße: ${MAX_BATCH} Zeilen`)
        return
      }
      setValidRows(parsed.rows)
      setErrors(parsed.errors)
      setStep(2)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'CSV-Datei konnte nicht gelesen werden.')
    }
  }

  async function generateZip() {
    if (!selectedTemplate || !file || validRows.length === 0) return

    setStep(3)
    setGenerating(true)
    setMessage(null)
    setResults([])
    clearDownload()

    const body = new FormData()
    body.set('templateId', selectedTemplate.id)
    body.set('file', file)

    try {
      const res = await fetch('/api/import/generate', { method: 'POST', body })
      const resultHeader = res.headers.get('X-Results')

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (Array.isArray(data?.errors)) setErrors(data.errors)
        throw new Error(data?.error || 'Rechnungen konnten nicht erzeugt werden.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setDownloadName(extractFilename(res.headers.get('Content-Disposition')) ?? 'rechnungen.zip')
      setResults(parseResultsHeader(resultHeader))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setGenerating(false)
    }
  }

  function resetToUpload() {
    setStep(1)
    setValidRows([])
    setErrors([])
    setResults([])
    setMessage(null)
    clearDownload()
  }

  function clearDownload() {
    setDownloadUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">CSV-Import</h1>
        <p className="text-gray-600 mt-1">Bis zu {MAX_BATCH} Rechnungen aus einer CSV-Datei erzeugen und als ZIP herunterladen.</p>
      </div>

      <StepIndicator step={step} />

      {message && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">1. Vorlage wählen</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`block cursor-pointer rounded-lg border p-4 transition ${templateId === template.id ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={templateId === template.id}
                    onChange={() => setTemplateId(template.id)}
                    className="sr-only"
                  />
                  <span className="font-semibold">{template.title}</span>
                  {template.description && <span className="mt-1 block text-sm text-gray-600">{template.description}</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">2. CSV-Datei hochladen</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              />
              {selectedTemplate && (
                <a
                  href={`/api/import/sample?template=${encodeURIComponent(selectedTemplate.id)}`}
                  className="shrink-0 text-sm text-blue-600 hover:underline"
                >
                  Mustervorlage herunterladen
                </a>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600">Trennzeichen: Semikolon oder Komma. Zeilen mit Validierungsfehlern werden nicht erzeugt.</p>
          </div>

          <button
            type="button"
            onClick={validateFile}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={!selectedTemplate || !file}
          >
            Prüfen
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Validierung</h2>
              <p className="text-sm text-gray-600">{validRows.length} gültige Zeilen, {errors.length} Fehler</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={resetToUpload} className="rounded-md border px-4 py-2 hover:bg-gray-50">Zurück</button>
              {validRows.length > 0 && (
                <button type="button" onClick={generateZip} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Erzeugen
                </button>
              )}
            </div>
          </div>

          <DataTable title="Gültige Zeilen" rows={validRows} fields={visibleFields} empty="Keine gültigen Zeilen gefunden." />
          <ErrorTable errors={errors} />
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-2">ZIP-Erstellung</h2>
            {generating && (
              <div className="space-y-3">
                <div className="h-2 overflow-hidden rounded bg-gray-200">
                  <div className="h-full w-1/2 animate-pulse rounded bg-blue-600" />
                </div>
                <p className="text-sm text-gray-600">PDFs werden erzeugt und in eine ZIP-Datei gepackt …</p>
              </div>
            )}
            {!generating && downloadUrl && (
              <div className="space-y-4">
                <p className="text-sm text-green-700">Import abgeschlossen.</p>
                <a href={downloadUrl} download={downloadName} className="inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Download
                </a>
              </div>
            )}
          </div>

          {results.length > 0 && <GenerationResults results={results} />}

          <button type="button" onClick={resetToUpload} className="rounded-md border px-4 py-2 hover:bg-gray-50">
            Neuer Import
          </button>
        </section>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: WizardStep }) {
  const labels = ['Auswahl', 'Validierung', 'Download']
  return (
    <ol className="mb-8 grid gap-2 sm:grid-cols-3">
      {labels.map((label, index) => {
        const number = index + 1
        const active = step === number
        const done = step > number
        return (
          <li key={label} className={`rounded-md border px-4 py-3 text-sm ${active ? 'border-blue-600 bg-blue-50' : done ? 'border-green-300 bg-green-50' : 'bg-white'}`}>
            <span className="font-semibold">Schritt {number}</span> · {label}
          </li>
        )
      })}
    </ol>
  )
}

function DataTable({ title, rows, fields, empty }: { title: string; rows: ParsedRow[]; fields: FieldDef[]; empty: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-gray-600">{empty}</p> : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Zeile</th>
                {fields.map((field) => <th key={field.name} className="px-3 py-2 text-left font-medium">{field.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 text-gray-500">{index + 2}</td>
                  {fields.map((field) => <td key={field.name} className="px-3 py-2">{row[field.name] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ErrorTable({ errors }: { errors: CsvError[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Fehler</h3>
      {errors.length === 0 ? <p className="text-sm text-gray-600">Keine Fehler gefunden.</p> : (
        <div className="overflow-x-auto rounded-lg border border-red-200">
          <table className="min-w-full divide-y divide-red-100 text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Zeile</th>
                <th className="px-3 py-2 text-left font-medium">Spalte</th>
                <th className="px-3 py-2 text-left font-medium">Meldung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100 bg-white">
              {errors.map((error, index) => (
                <tr key={`${error.line}-${error.column}-${index}`}>
                  <td className="px-3 py-2">{error.line}</td>
                  <td className="px-3 py-2">{error.column}</td>
                  <td className="px-3 py-2 text-red-700">{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GenerationResults({ results }: { results: GenerationResult[] }) {
  const failures = results.filter((result) => result.error)
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-2">Ergebnis</h3>
      <p className="text-sm text-gray-600 mb-3">
        {results.length - failures.length} erfolgreich, {failures.length} fehlgeschlagen
      </p>
      {failures.length > 0 && (
        <div className="overflow-x-auto rounded border border-red-200">
          <table className="min-w-full text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Zeile/Datei</th>
                <th className="px-3 py-2 text-left font-medium">Fehler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {failures.map((result) => (
                <tr key={result.filename}>
                  <td className="px-3 py-2">{result.filename}</td>
                  <td className="px-3 py-2 text-red-700">{result.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function readCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

function parseCsvForPreview(text: string, schema: TemplateSchema): { rows: ParsedRow[]; errors: CsvError[]; totalRows: number } {
  const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { rows: [], errors: [{ line: 1, column: 'header', message: 'CSV-Datei ist leer' }], totalRows: 0 }

  const delimiter = lines[0].includes(';') ? ';' : ','
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.toLowerCase().trim())
  const dataLines = lines.slice(1)
  const requiredFields = schema.fields.filter((field) => field.required && field.type !== 'line-items').map((field) => field.name)
  const numberFields = schema.fields.filter((field) => field.type === 'currency' || field.type === 'number').map((field) => field.name)
  const rows: ParsedRow[] = []
  const errors: CsvError[] = []

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2
    const values = splitCsvLine(line, delimiter)
    const row: ParsedRow = {}
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() ?? ''
    })

    const rowErrors: CsvError[] = []
    requiredFields.forEach((field) => {
      if (!(row[field.toLowerCase()] ?? '').trim()) {
        rowErrors.push({ line: lineNumber, column: field, message: `Pflichtfeld "${field}" fehlt` })
      }
    })
    numberFields.forEach((field) => {
      const value = row[field.toLowerCase()] ?? ''
      if (value.trim() && !isGermanNumber(value)) {
        rowErrors.push({ line: lineNumber, column: field, message: `Ungültige Zahl im Feld "${field}": "${value}"` })
      }
    })

    if (rowErrors.length > 0) errors.push(...rowErrors)
    else rows.push(row)
  })

  return { rows, errors, totalRows: dataLines.length }
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function isGermanNumber(value: string): boolean {
  const raw = value.trim()
  if (!raw) return false
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/\s/g, '')
  return Number.isFinite(Number.parseFloat(normalized))
}

function parseResultsHeader(header: string | null): GenerationResult[] {
  if (!header) return []
  try {
    const parsed = JSON.parse(header)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return match?.[1] ?? null
}
