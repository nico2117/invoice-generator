import { NextResponse } from 'next/server'

export async function GET() {
  let db = false
  let storage = false

  // Check DB connectivity
  try {
    const { getDb } = await import('@/lib/db/client')
    const dbClient = getDb()
    await dbClient.execute('SELECT 1' as never)
    db = true
  } catch { /* DB not available */ }

  // Check storage connectivity (just check if env vars are set)
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      storage = true
    }
  } catch { /* storage not available */ }

  return NextResponse.json({ ok: true, db, storage })
}
