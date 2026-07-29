import Link from 'next/link'
import { TEMPLATES } from '@/lib/templates/registry'

export default function NeueRechnungPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Neue Rechnung</h1>
      <div className="grid gap-4">
        {Object.values(TEMPLATES).map((template) => (
          <Link
            key={template.id}
            href={`/rechnung/neu/${template.id}`}
            className="block p-4 border rounded hover:bg-gray-50"
          >
            <div className="font-semibold">{template.title}</div>
            {template.description && <div className="text-sm text-gray-600">{template.description}</div>}
          </Link>
        ))}
      </div>
    </div>
  )
}
