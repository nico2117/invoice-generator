import Link from 'next/link'
import { listContacts, countContacts } from '@/lib/db/queries/contacts'

export default async function KontaktePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit

  const [contacts, totalCount] = await Promise.all([
    listContacts({ search: q, limit, offset }),
    countContacts({ search: q }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <Link
          href="/kontakte/neu"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
        >
          Neuer Kontakt
        </Link>
      </div>

      <div className="mb-6">
        <form method="GET" action="/kontakte" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Suchen..."
            className="border border-gray-300 rounded px-3 py-2 flex-grow max-w-md"
          />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded">
            Suchen
          </button>
        </form>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500 mb-4">
            {q ? 'Keine Kontakte für diese Suche gefunden.' : 'Noch keine Kontakte vorhanden.'}
          </p>
          {!q && (
            <Link href="/kontakte/neu" className="text-blue-600 hover:underline">
              Neuen Kontakt erstellen?
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Firmenname</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Ansprechperson</th>
                <th className="px-4 py-3 font-semibold text-gray-700">PLZ/Ort</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{contact.firmenname}</div>
                    {contact.nachname && (
                      <div className="text-sm text-gray-500">
                        {contact.titel ? `${contact.titel} ` : ''}
                        {contact.anrede} {contact.nachname}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{contact.ansprechperson || '-'}</td>
                  <td className="px-4 py-3">
                    {contact.plz} {contact.ort}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/rechnung/neu?kontakt=${contact.id}`}
                      className="text-green-600 hover:underline text-sm font-medium"
                    >
                      Rechnung erstellen
                    </Link>
                    <Link
                      href={`/kontakte/${contact.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/kontakte?q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Zurück
            </Link>
          )}
          <span className="px-3 py-1 text-gray-600">
            Seite {page} von {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/kontakte?q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Weiter
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
