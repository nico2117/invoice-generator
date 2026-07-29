import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Willkommen</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/rechnung/neu" className="block p-6 bg-white border rounded-lg hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Neue Rechnung</h2>
          <p className="text-gray-600">Rechnung oder Dokument erstellen</p>
        </Link>
        <Link href="/archiv" className="block p-6 bg-white border rounded-lg hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Archiv</h2>
          <p className="text-gray-600">Alle erstellten Rechnungen</p>
        </Link>
        <Link href="/kontakte" className="block p-6 bg-white border rounded-lg hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Kontakte</h2>
          <p className="text-gray-600">Adressbuch verwalten</p>
        </Link>
        <Link href="/import" className="block p-6 bg-white border rounded-lg hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Import</h2>
          <p className="text-gray-600">CSV-Massenerstellung</p>
        </Link>
        <Link href="/einstellungen" className="block p-6 bg-white border rounded-lg hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Einstellungen</h2>
          <p className="text-gray-600">Vereinsdaten bearbeiten</p>
        </Link>
      </div>
    </div>
  )
}
