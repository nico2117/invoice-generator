// Windows-reserved names (case-insensitive)
const WINDOWS_RESERVED = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i

export function sanitizeForFilename(s: string): string {
  // 1. Transliterate German umlauts FIRST (before stripping non-ASCII)
  let r = s
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
  // 2. Replace anything non-alphanumeric with underscore
  r = r.replace(/[^A-Za-z0-9]/g, '_')
  // 3. Collapse runs of underscores
  r = r.replace(/_+/g, '_')
  // 4. Trim leading/trailing underscores
  r = r.replace(/^_+|_+$/g, '')
  // 5. Truncate
  r = r.substring(0, 80)
  // 6. Empty fallback
  if (!r) return 'Empfaenger'
  // 7. Windows reserved names
  if (WINDOWS_RESERVED.test(r)) r = r + '_'
  return r
}

export function padInvoiceNumber(n: number): string {
  return String(n).padStart(3, '0')
}

export function buildInvoiceFilename(opts: { jahr: number; nummer: number; empfaenger: string }): string {
  const safe = sanitizeForFilename(opts.empfaenger)
  return `R${opts.jahr}-${padInvoiceNumber(opts.nummer)}_${safe}.pdf`
}
