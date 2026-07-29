import { NextResponse } from 'next/server'
import { getInvoice } from '@/lib/db/queries/invoices'
import { fetchPdf } from '@/lib/storage/blob'
import { createHash } from 'crypto'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pdfBytes = await fetchPdf(invoice.pdfBlobUrl)

  // Verify SHA-256 integrity — logs a warning on mismatch, never fails the download
  const actualSha256 = createHash('sha256').update(pdfBytes).digest('hex')
  if (actualSha256 !== invoice.pdfSha256) {
    console.warn(`SHA-256 mismatch for invoice ${id}: expected ${invoice.pdfSha256}, got ${actualSha256}`)
  }

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.pdfFilename}"`,
      'Content-Length': String(pdfBytes.length),
    },
  })
}
