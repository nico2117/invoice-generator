import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold mb-4">Seite nicht gefunden</h1>
      <Link href="/" className="text-blue-600">Zur Startseite</Link>
    </div>
  )
}
