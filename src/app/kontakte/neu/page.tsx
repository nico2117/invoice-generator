'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createContactAction } from '../actions'

export default function NewContactPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)
    const res = await createContactAction(formData)
    if (res.success) {
      router.push('/kontakte')
    } else {
      setError(res.error || 'Ein Fehler ist aufgetreten.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neuer Kontakt</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form action={onSubmit} className="space-y-6 bg-white p-6 rounded border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname *
            </label>
            <input
              type="text"
              name="firmenname"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anrede *
            </label>
            <select name="anrede" required className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="Frau">Frau</option>
              <option value="Herrn">Herrn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input type="text" name="titel" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname *
            </label>
            <input type="text" name="nachname" required className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ansprechperson
            </label>
            <input type="text" name="ansprechperson" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div className="md:col-span-2 grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße *
              </label>
              <input type="text" name="strasse" required className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hausnummer *
              </label>
              <input type="text" name="hausnummer" required className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ *
              </label>
              <input type="text" name="plz" required className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
              <input type="text" name="ort" required className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input type="email" name="email" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notiz
            </label>
            <textarea name="notiz" rows={3} className="w-full border border-gray-300 rounded px-3 py-2"></textarea>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </button>
          <Link
            href="/kontakte"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-6 py-2 rounded font-medium text-center"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
