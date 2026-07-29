'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateContactAction, deleteContactAction } from '../actions'

type Contact = {
  id: string
  firmenname: string
  anrede: string
  titel: string | null
  nachname: string
  ansprechperson: string | null
  strasse: string
  hausnummer: string
  plz: string
  ort: string
  email: string | null
  notiz: string | null
}

export function EditContactForm({ contact, affectedInvoices }: { contact: Contact; affectedInvoices: number }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)
    const res = await updateContactAction(contact.id, formData)
    if (res.success) {
      router.push('/kontakte')
    } else {
      setError(res.error || 'Ein Fehler ist aufgetreten.')
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Bitte bestätigen Sie das Löschen.')) return
    setIsDeleting(true)
    setError(null)
    const res = await deleteContactAction(contact.id)
    if (res.success) {
      router.push('/kontakte')
    } else {
      setError(res.error || 'Ein Fehler ist aufgetreten beim Löschen.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
          {error}
        </div>
      )}

      <form action={onSubmit} className="bg-white p-6 rounded border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname *
            </label>
            <input
              type="text"
              name="firmenname"
              required
              defaultValue={contact.firmenname}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anrede *
            </label>
            <select name="anrede" required defaultValue={contact.anrede} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="Frau">Frau</option>
              <option value="Herrn">Herrn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input type="text" name="titel" defaultValue={contact.titel || ''} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname *
            </label>
            <input type="text" name="nachname" required defaultValue={contact.nachname} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ansprechperson
            </label>
            <input type="text" name="ansprechperson" defaultValue={contact.ansprechperson || ''} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div className="md:col-span-2 grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße *
              </label>
              <input type="text" name="strasse" required defaultValue={contact.strasse} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hausnummer *
              </label>
              <input type="text" name="hausnummer" required defaultValue={contact.hausnummer} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ *
              </label>
              <input type="text" name="plz" required defaultValue={contact.plz} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
              <input type="text" name="ort" required defaultValue={contact.ort} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input type="email" name="email" defaultValue={contact.email || ''} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notiz
            </label>
            <textarea name="notiz" rows={3} defaultValue={contact.notiz || ''} className="w-full border border-gray-300 rounded px-3 py-2"></textarea>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
          <button
            type="submit"
            disabled={isSubmitting || isDeleting}
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

      <div className="bg-red-50 p-6 rounded border border-red-200">
        <h2 className="text-red-800 font-bold mb-2">Kontakt löschen</h2>
        <p className="text-red-600 mb-4">
          Dieser Kontakt wird in {affectedInvoices} Rechnung(en) referenziert. Die Rechnungen bleiben erhalten.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting || isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
        </button>
      </div>
    </div>
  )
}
