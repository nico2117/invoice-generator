import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomUUID } from 'crypto'
import path from 'path'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. ' +
      'These are server-only env vars — never expose them to the client.'
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

const PDF_BUCKET = 'rechnungen'
const LOGO_BUCKET = 'logos'

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

function computeSha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

/**
 * Store a PDF buffer. Returns the object path and SHA-256.
 * The object path (not a public URL) is what gets stored in invoices.pdfBlobUrl.
 */
export async function storePdf(
  bytes: Buffer,
  filename: string
): Promise<{ path: string; sha256: string }> {
  // Validate: must start with %PDF-
  if (bytes.length < 5 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new StorageError('Uploaded bytes are not a valid PDF (does not start with %PDF-)')
  }

  const sha256 = computeSha256(bytes)
  // Build a collision-proof key: {year}/{uuid}-{filename}
  const year = new Date().getFullYear()
  const uuid = randomUUID()
  const safeName = path.basename(filename).replace(/[^A-Za-z0-9._-]/g, '_')
  const objectPath = `${year}/${uuid}-${safeName}`

  const supabase = getSupabaseClient()
  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(objectPath, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) throw new StorageError(`Failed to upload PDF: ${error.message}`)

  return { path: objectPath, sha256 }
}

/**
 * Store a logo image. Returns the object path.
 */
export async function storeLogo(
  bytes: Buffer,
  filename: string,
  contentType: string
): Promise<{ path: string }> {
  if (!['image/png', 'image/jpeg'].includes(contentType)) {
    throw new StorageError('Logo must be image/png or image/jpeg')
  }
  if (bytes.length > 2 * 1024 * 1024) {
    throw new StorageError('Logo must be ≤ 2 MB')
  }

  const supabase = getSupabaseClient()
  const uuid = randomUUID()
  const ext = contentType === 'image/png' ? '.png' : '.jpg'
  const objectPath = `${uuid}${ext}`

  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(objectPath, bytes, { contentType, upsert: false })

  if (error) throw new StorageError(`Failed to upload logo: ${error.message}`)

  return { path: objectPath }
}

/**
 * Fetch a PDF by its object path. Returns the raw bytes.
 */
export async function fetchPdf(objectPath: string): Promise<Buffer> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(objectPath)
  if (error || !data) throw new StorageError(`Failed to fetch PDF at ${objectPath}: ${error?.message}`)
  const arrayBuf = await data.arrayBuffer()
  return Buffer.from(arrayBuf)
}

/**
 * Get a short-lived signed URL for inline display (PDF viewer / logo preview).
 */
export async function getSignedUrl(
  bucket: 'rechnungen' | 'logos',
  objectPath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds)
  if (error || !data?.signedUrl) throw new StorageError(`Failed to create signed URL: ${error?.message}`)
  return data.signedUrl
}

/**
 * Delete a blob — ONLY for logos, never for invoices.
 */
export async function deleteBlob(bucket: 'logos', objectPath: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.storage.from(bucket).remove([objectPath])
  if (error) throw new StorageError(`Failed to delete blob: ${error.message}`)
}
