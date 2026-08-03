'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteButton({ invoiceId, label }: { invoiceId: string; label: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const res = await fetch(`/api/archiv/${invoiceId}/delete`, { method: 'POST' })
    if (res.ok) {
      router.push('/archiv')
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-red-700">{label} wirklich löschen?</span>
        <button onClick={handleDelete} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Ja, löschen</button>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 text-xs border rounded">Abbrechen</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-sm text-red-600 hover:text-red-800">
      Löschen
    </button>
  )
}
