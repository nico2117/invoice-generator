import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const BUCKETS = ['rechnungen', 'logos']

  const { data: existing } = await supabase.storage.listBuckets()
  const existingNames = new Set(existing?.map(b => b.name) ?? [])

  for (const name of BUCKETS) {
    if (existingNames.has(name)) {
      console.log(`Bucket "${name}" already exists — skipping`)
    } else {
      const { error } = await supabase.storage.createBucket(name, { public: false })
      if (error) {
        console.error(`Failed to create bucket "${name}":`, error.message)
        process.exit(1)
      }
      console.log(`Created private bucket "${name}"`)
    }
  }

  console.log('Storage setup complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
