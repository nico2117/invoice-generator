'use client'
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold mb-4">Ein Fehler ist aufgetreten</h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded">Nochmals versuchen</button>
      <a href="/" className="ml-4 text-blue-600">Zur Startseite</a>
    </div>
  )
}
