import { NextResponse } from 'next/server'
import { deleteInvoice } from '@/lib/db/queries/invoices'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await deleteInvoice(id)
    revalidatePath('/archiv')
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
