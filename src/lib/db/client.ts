import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function getConnectionUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is missing. ' +
      'Set it to the Supabase Supavisor pooler URL (port 6543) in .env.local'
    )
  }
  return url
}

// Singleton client — reused across invocations within one Lambda container
let _client: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (_client) return _client
  const connectionString = getConnectionUrl()
  const sql = postgres(connectionString, {
    prepare: false,  // REQUIRED: Supavisor transaction pooling does not support prepared statements
    max: 1,          // One connection per serverless invocation
  })
  _client = drizzle(sql, { schema })
  return _client
}

export type Db = ReturnType<typeof getDb>
