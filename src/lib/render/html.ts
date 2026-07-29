import { marked } from 'marked'
import { PRINT_CSS } from './print-css'

interface SettingsForHtml {
  vereinsname: string
  strasse: string
  plz: string
  ort: string
  zvrZahl: string
  sig1Name: string
  sig1Rolle: string
  sig2Name: string
  sig2Rolle: string
  bankname: string
  iban: string
  bic: string
  kleinunternehmerHinweis: string
}

interface BuildDocumentHtmlOptions {
  /** Filled Markdown — already substituted by fillTemplate() */
  markdown: string
  /** Settings from the DB for the sender block */
  settings: SettingsForHtml
  /** Logo as a base64 data URI, e.g. "data:image/png;base64,..." or null */
  logoDataUri: string | null
}

/**
 * Convert filled Markdown to a complete, self-contained print-ready HTML document.
 * The HTML inlines PRINT_CSS (no network requests during PDF rendering).
 * The sender block is built from settings — NO hardcoded Verein data.
 */
export function buildDocumentHtml(opts: BuildDocumentHtmlOptions): string {
  const { markdown, settings, logoDataUri } = opts

  // Configure marked to pass raw HTML through (the templates contain <div class="meta-right"> etc.)
  marked.setOptions({ gfm: true, breaks: false })

  const htmlContent = marked(markdown) as string

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Logo" class="logo">`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="sender-info">
      <strong>${settings.vereinsname}</strong><br>
      ${settings.strasse ? settings.strasse + '<br>' : ''}
      ${settings.plz} ${settings.ort}<br>
      ${settings.zvrZahl ? 'ZVR: ' + settings.zvrZahl : ''}
    </div>
  </div>
  ${htmlContent}
</body>
</html>`
}
