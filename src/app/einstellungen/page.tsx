import { getSettings, assertSettingsComplete } from '@/lib/db/queries/settings'
import { getSignedUrl } from '@/lib/storage/blob'
import { updateSettingsAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function EinstellungenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const settings = await getSettings()
  const resolvedSearchParams = await searchParams

  let warningMessage = ''
  try {
    await assertSettingsComplete()
  } catch (err: any) {
    warningMessage = err.message
  }

  let logoUrl = ''
  if (settings.logoBlobUrl) {
    try {
      logoUrl = await getSignedUrl('logos', settings.logoBlobUrl, 3600)
    } catch (e) {
      console.error('Failed to get signed url for logo', e)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Vereinsdaten</h1>

      {warningMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Achtung:</strong> {warningMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {resolvedSearchParams.success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">Vereinsdaten gespeichert</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-8">
        Bereits erstellte Rechnungen behalten ihre originalen Vereinsdaten.
      </p>

      {/* @ts-ignore */}
      <form action={updateSettingsAction} className="space-y-8">
        {/* Verein */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Verein</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="vereinsname" className="block text-sm font-medium text-gray-700">Vereinsname</label>
              <input type="text" name="vereinsname" id="vereinsname" defaultValue={settings.vereinsname || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="strasse" className="block text-sm font-medium text-gray-700">Straße</label>
              <input type="text" name="strasse" id="strasse" defaultValue={settings.strasse || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="plz" className="block text-sm font-medium text-gray-700">PLZ</label>
              <input type="text" name="plz" id="plz" defaultValue={settings.plz || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="ort" className="block text-sm font-medium text-gray-700">Ort</label>
              <input type="text" name="ort" id="ort" defaultValue={settings.ort || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="zvrZahl" className="block text-sm font-medium text-gray-700">ZVR-Zahl</label>
              <input type="text" name="zvrZahl" id="zvrZahl" defaultValue={settings.zvrZahl || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
          </div>
        </section>

        {/* Bankverbindung */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Bankverbindung</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="bankname" className="block text-sm font-medium text-gray-700">Bankname</label>
              <input type="text" name="bankname" id="bankname" defaultValue={settings.bankname || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700">IBAN</label>
              <input type="text" name="iban" id="iban" defaultValue={settings.iban || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="bic" className="block text-sm font-medium text-gray-700">BIC</label>
              <input type="text" name="bic" id="bic" defaultValue={settings.bic || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
          </div>
        </section>

        {/* Rechtlicher Hinweis */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Rechtlicher Hinweis</h2>
          <div>
            <label htmlFor="kleinunternehmerHinweis" className="block text-sm font-medium text-gray-700">Kleinunternehmer-Hinweis</label>
            <textarea name="kleinunternehmerHinweis" id="kleinunternehmerHinweis" rows={3} defaultValue={settings.kleinunternehmerHinweis || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"></textarea>
          </div>
        </section>

        {/* Unterschriften */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Unterschriften</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sig1Name" className="block text-sm font-medium text-gray-700">Unterschrift 1: Name</label>
              <input type="text" name="sig1Name" id="sig1Name" defaultValue={settings.sig1Name || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="sig1Rolle" className="block text-sm font-medium text-gray-700">Unterschrift 1: Rolle</label>
              <input type="text" name="sig1Rolle" id="sig1Rolle" defaultValue={settings.sig1Rolle || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="sig2Name" className="block text-sm font-medium text-gray-700">Unterschrift 2: Name</label>
              <input type="text" name="sig2Name" id="sig2Name" defaultValue={settings.sig2Name || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label htmlFor="sig2Rolle" className="block text-sm font-medium text-gray-700">Unterschrift 2: Rolle</label>
              <input type="text" name="sig2Rolle" id="sig2Rolle" defaultValue={settings.sig2Rolle || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Logo</h2>
          <div className="space-y-4">
            {logoUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Aktuelles Logo</p>
                <img src={logoUrl} alt="Vereinslogo" className="h-24 object-contain border rounded p-1" />
              </div>
            )}
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Neues Logo hochladen</label>
              <input type="file" name="logo" id="logo" accept="image/png,image/jpeg" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Speichern
          </button>
        </div>
      </form>
    </div>
  )
}
