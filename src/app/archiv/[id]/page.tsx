import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInvoice } from '@/lib/db/queries/invoices'
import { DeleteButton } from '../DeleteButton'

function formatBetrag(value: string): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(value))
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNummer(jahr: number, nummer: number): string {
  return `R${jahr}-${String(nummer).padStart(3, '0')}`
}

function SnapshotSection({ title, data }: { title: string; data: unknown }) {
  if (!data || typeof data !== 'object') return null
  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  )
  if (entries.length === 0) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="text-xs text-gray-500 min-w-[120px] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</dt>
            <dd className="text-xs text-gray-900 break-all">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default async function ArchivDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const downloadUrl = `/api/archiv/${id}/download`

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/archiv" className="text-sm text-blue-600 hover:underline">← Zurück zum Archiv</Link>
          <h1 className="text-2xl font-bold mt-1">
            Rechnung {formatNummer(invoice.jahr, invoice.rechnungsnummer)}
          </h1>
        </div>
        <a
          href={downloadUrl}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Herunterladen
        </a>
        <DeleteButton
          invoiceId={invoice.id}
          label={`R${invoice.jahr}-${String(invoice.rechnungsnummer).padStart(3,'0')}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Metadata card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Rechnungsdaten</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Rechnungsnummer</dt>
              <dd className="font-mono font-medium">{formatNummer(invoice.jahr, invoice.rechnungsnummer)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Jahr</dt>
              <dd>{invoice.jahr}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Erstellt am</dt>
              <dd>{formatDate(invoice.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Vorlage</dt>
              <dd className="font-mono text-xs">{invoice.templateId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Betrag gesamt</dt>
              <dd className="font-semibold text-gray-900">{formatBetrag(invoice.betragGesamt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Dateiname</dt>
              <dd className="font-mono text-xs break-all">{invoice.pdfFilename}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">SHA-256</dt>
              <dd className="font-mono text-xs break-all text-gray-400" title={invoice.pdfSha256}>
                {invoice.pdfSha256.slice(0, 16)}…
              </dd>
            </div>
          </dl>
        </div>

        {/* Snapshots card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Daten zum Erstellungszeitpunkt</h2>
          <SnapshotSection title="Verein (Absender)" data={invoice.settingsSnapshot} />
          <SnapshotSection title="Empfänger" data={invoice.empfaengerSnapshot} />
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">PDF-Vorschau</h2>
          <a
            href={downloadUrl}
            className="text-xs text-blue-600 hover:underline"
          >
            In neuem Tab öffnen ↗
          </a>
        </div>
        <object
          data={downloadUrl}
          type="application/pdf"
          className="w-full"
          style={{ height: '80vh' }}
        >
          <iframe
            src={downloadUrl}
            className="w-full"
            style={{ height: '80vh', border: 'none' }}
            title={`Rechnung ${formatNummer(invoice.jahr, invoice.rechnungsnummer)}`}
          >
            <p className="p-4 text-sm text-gray-500">
              PDF-Vorschau nicht verfügbar.{' '}
              <a href={downloadUrl} className="text-blue-600 hover:underline">PDF herunterladen</a>
            </p>
          </iframe>
        </object>
      </div>
    </div>
  )
}
