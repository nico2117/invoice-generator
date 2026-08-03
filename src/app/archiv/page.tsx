import Link from 'next/link'
import { listInvoices, listYears, countInvoices } from '@/lib/db/queries/invoices'
import { DeleteButton } from './DeleteButton'

const PAGE_SIZE = 20

function formatBetrag(value: string): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(value))
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatNummer(jahr: number, nummer: number): string {
  return `R${jahr}-${String(nummer).padStart(3, '0')}`
}

function getEmpfaenger(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return '—'
  const s = snapshot as Record<string, unknown>
  if (s.firmenname && typeof s.firmenname === 'string') return s.firmenname
  const parts = [s.anrede, s.nachname].filter(Boolean)
  return parts.join(' ') || '—'
}

export default async function ArchivPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : ''
  const jahrRaw = typeof sp.jahr === 'string' ? parseInt(sp.jahr, 10) : undefined
  const jahr = jahrRaw && !isNaN(jahrRaw) ? jahrRaw : undefined
  const pageRaw = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
  const page = pageRaw > 0 ? pageRaw : 1

  const [allYears, total, rows] = await Promise.all([
    listYears(),
    countInvoices({ search: q, jahr }),
    listInvoices({ search: q, jahr, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (jahr) params.set('jahr', String(jahr))
    if (page > 1) params.set('page', String(page))
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) params.delete(k)
      else params.set(k, v)
    }
    // Always reset page when filter changes (unless explicitly set)
    if ('q' in overrides || 'jahr' in overrides) params.delete('page')
    const s = params.toString()
    return `/archiv${s ? `?${s}` : ''}`
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Rechnungsarchiv</h1>

      {/* Filter bar */}
      <form method="GET" action="/archiv" className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Dateiname suchen…"
          className="flex-1 min-w-[180px] rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="jahr"
          defaultValue={jahr ?? ''}
          className="rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle Jahre</option>
          {allYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Suchen
        </button>
        {(q || jahr) && (
          <Link
            href="/archiv"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">Noch keine Rechnungen erstellt</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Nummer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Datum</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Empfänger</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Vorlage</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Betrag</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">
                      {formatNummer(inv.jahr, inv.rechnungsnummer)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {getEmpfaenger(inv.empfaengerSnapshot)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.templateId}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatBetrag(inv.betragGesamt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={`/archiv/${inv.id}`}
                          className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          Ansehen
                        </a>
                        <a
                          href={`/api/archiv/${inv.id}/download`}
                          className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                        >
                          Download
                        </a>
                        <DeleteButton
                          invoiceId={inv.id}
                          label={formatNummer(inv.jahr, inv.rechnungsnummer)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Seite {page} von {totalPages} ({total} Rechnungen)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={buildUrl({ page: String(page - 1) })}
                    className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  >
                    ← Zurück
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={buildUrl({ page: String(page + 1) })}
                    className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  >
                    Weiter →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
