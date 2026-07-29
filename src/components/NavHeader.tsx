'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavHeader({ vereinsname }: { vereinsname: string }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return null
  }

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">{vereinsname}</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/rechnung/neu" className="hover:text-blue-600">Rechnung erstellen</Link>
          <Link href="/archiv" className="hover:text-blue-600">Archiv</Link>
          <Link href="/kontakte" className="hover:text-blue-600">Kontakte</Link>
          <Link href="/import" className="hover:text-blue-600">Import</Link>
          <Link href="/einstellungen" className="hover:text-blue-600">Einstellungen</Link>
        </nav>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-red-600">Abmelden</button>
        </form>
      </div>
    </header>
  )
}
