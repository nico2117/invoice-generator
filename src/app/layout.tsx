import type { Metadata } from 'next'
import './globals.css'
import { getSettings } from '@/lib/db/queries/settings'
import NavHeader from '@/components/NavHeader'

export const metadata: Metadata = { title: 'Rechnungs-Generator' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let vereinsname = 'Rechnungs-Generator'
  try {
    const s = await getSettings()
    if (s && s.vereinsname) {
      vereinsname = s.vereinsname
    }
  } catch { /* DB not yet connected */ }

  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <NavHeader vereinsname={vereinsname} />
        <main className="max-w-6xl mx-auto px-4 py-6 flex-grow">{children}</main>
      </body>
    </html>
  )
}
