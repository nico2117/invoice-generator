import { NextRequest, NextResponse } from 'next/server'
import { listContacts } from '@/lib/db/queries/contacts'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const contacts = await listContacts({ search: q, limit: 20 })
  return NextResponse.json(contacts.map((contact) => ({
    id: contact.id,
    name: contact.firmenname,
    firma: contact.firmenname,
    firmenname: contact.firmenname,
    anrede: contact.anrede,
    titel: contact.titel ?? '',
    ansprechperson: contact.ansprechperson ?? '',
    nachname: contact.nachname,
    strasse: contact.strasse,
    hausnummer: contact.hausnummer,
    plz: contact.plz,
    ort: contact.ort,
    email: contact.email ?? '',
  })))
}
