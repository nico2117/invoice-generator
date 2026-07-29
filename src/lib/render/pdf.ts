import puppeteerCore, { type Browser, type Page } from 'puppeteer-core'

const setContentOptions = { waitUntil: 'networkidle0' } as unknown as Parameters<Page['setContent']>[1]

/**
 * Get a Puppeteer browser instance.
 * - On Vercel (process.env.VERCEL): uses @sparticuz/chromium with ESM-compatible API
 * - Locally: uses CHROME_EXECUTABLE_PATH or falls back to channel:'chrome'
 *
 * IMPORTANT for @sparticuz/chromium@149:
 * - The package is ESM-only (use dynamic import)
 * - chromium.args is a plain array (not awaited)
 * - chromium.executablePath() returns a Promise — must be awaited
 * - chromium.font() should be called to register fonts before launch (belt-and-braces for Lambda)
 */
type ChromiumBrowser = typeof import('@sparticuz/chromium').default & {
  font?: (input: string) => Promise<unknown>
  headless?: boolean | 'shell'
}

async function getBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    // Dynamic import required — @sparticuz/chromium@149 is ESM-only
    const chromium = (await import('@sparticuz/chromium')).default as ChromiumBrowser

    // Register DejaVu Sans with Chromium (belt-and-braces alongside CSS @font-face)
    // chromium.font() accepts a URL or a file path
    await chromium.font?.('https://cdn.jsdelivr.net/npm/@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff')
      .catch(() => { /* non-fatal if CDN unreachable — @font-face base64 in CSS is the primary mechanism */ })

    const executablePath = await chromium.executablePath()

    return puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless ?? true,
    })
  } else {
    // Local development
    const executablePath = process.env.CHROME_EXECUTABLE_PATH
    if (executablePath) {
      return puppeteerCore.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    }
    // Fallback: try system Chrome
    return puppeteerCore.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
}

/**
 * Render a single HTML document to an A4 PDF.
 * Uses A4 format with 15mm top/bottom and 20mm left/right margins.
 * printBackground: true is required for background colours and the header border.
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    try {
      await page.setContent(html, setContentOptions)
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' },
      })
      return Buffer.from(pdfBuffer)
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

/**
 * Render multiple HTML documents to PDFs, reusing ONE browser instance.
 * This is critical for batch generation (Task 26) — launching per-document would
 * exceed Vercel's function timeout for a batch of ~50 invoices.
 */
export async function renderPdfBatch(htmls: string[]): Promise<Buffer[]> {
  if (htmls.length === 0) return []
  const browser = await getBrowser()
  try {
    const results: Buffer[] = []
    for (const html of htmls) {
      const page = await browser.newPage()
      try {
        await page.setContent(html, setContentOptions)
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' },
        })
        results.push(Buffer.from(pdfBuffer))
      } finally {
        await page.close()
      }
    }
    return results
  } finally {
    await browser.close()
  }
}

/**
 * Route segment config hint — consuming routes (Tasks 23, 26) must export these.
 * Exporting them here as documentation; actual route files must re-export them.
 */
export const RENDER_ROUTE_CONFIG = {
  maxDuration: 60,
  runtime: 'nodejs',
} as const
