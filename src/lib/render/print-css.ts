import fs from 'fs'
import path from 'path'

const fontsDir = path.join(process.cwd(), 'src', 'assets', 'fonts')

// Body font: DejaVu Sans (umlaut-safe, embedded for Lambda which has no system fonts)
const dejaVuRegularBase64 = fs.readFileSync(path.join(fontsDir, 'DejaVuSans.ttf')).toString('base64')
const dejaVuBoldBase64 = fs.readFileSync(path.join(fontsDir, 'DejaVuSans-Bold.ttf')).toString('base64')

// Signature font: Dancing Script (decorative cursive for the sig block)
const dancingMediumBase64 = fs.readFileSync(path.join(fontsDir, 'DancingScript-Medium.ttf')).toString('base64')
const dancingBoldBase64 = fs.readFileSync(path.join(fontsDir, 'DancingScript-Bold.ttf')).toString('base64')

/**
 * Standalone print stylesheet for A4 PDF rendering.
 * - @page margins are set here (15mm top/bottom, 20mm left/right)
 * - Puppeteer must use margin: { top: '0', bottom: '0', left: '0', right: '0' }
 *   to avoid double-margin. See src/lib/render/pdf.ts.
 * - All fonts embedded as base64 — no network requests during rendering.
 * - No Tailwind, no @apply, no external URLs.
 */
export const PRINT_CSS = `
@font-face {
  font-family: 'DejaVu Sans';
  font-style: normal;
  font-weight: normal;
  src: url('data:font/truetype;base64,${dejaVuRegularBase64}') format('truetype');
}
@font-face {
  font-family: 'DejaVu Sans';
  font-style: normal;
  font-weight: bold;
  src: url('data:font/truetype;base64,${dejaVuBoldBase64}') format('truetype');
}
@font-face {
  font-family: 'Dancing Script';
  font-style: normal;
  font-weight: 500;
  src: url('data:font/truetype;base64,${dancingMediumBase64}') format('truetype');
}
@font-face {
  font-family: 'Dancing Script';
  font-style: normal;
  font-weight: 700;
  src: url('data:font/truetype;base64,${dancingBoldBase64}') format('truetype');
}

@page {
  size: A4;
  margin: 15mm 20mm 15mm 20mm;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: 'DejaVu Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 10pt;
  line-height: 1.4;
  color: #333;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Header with logo */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 2px solid #2f7d29;
}

.header .logo {
  max-width: 160px;
  height: auto;
  margin-top: -12px;
}

.header .sender-info {
  text-align: left;
  font-size: 10pt;
  color: #333;
  line-height: 1.5;
}

/* Main title */
h1 {
  font-size: 14pt;
  color: #2f7d29;
  margin-bottom: 15px;
  display: none;
}

h2 {
  font-size: 11pt;
  color: #2f7d29;
  margin-top: 18px;
  margin-bottom: 12px;
}

/* Recipient address block */
.recipient {
  margin: 30px 0;
  line-height: 1.4;
}

/* Date and invoice number */
.meta {
  margin: 25px 0;
}
.meta strong {
  display: block;
  margin-bottom: 5px;
}

/* Date and invoice number — right aligned */
.meta-right {
  text-align: right;
  margin: 20px 0;
}
.meta-right div {
  margin-bottom: 3px;
}

/* Horizontal rules */
hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 20px 0;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}
table th,
table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #2f7d29;
}
table th:last-child,
table td:last-child {
  font-weight: 500;
  width: 120px;
  white-space: nowrap;
  text-align: right;
}

/* Bank details */
.bank-details {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

/* Signature block */
.signatures {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 15px;
  break-inside: avoid;
}
.sig {
  text-align: center;
}
.sig .name {
  display: block;
  font-family: 'Dancing Script', cursive;
  font-size: 18pt;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 3px;
}
.sig .role {
  display: block;
  font-family: 'DejaVu Sans', 'Segoe UI', Tahoma, sans-serif;
  font-size: 8pt;
  color: #666;
}

/* Paragraphs */
p { margin: 12px 0; }

em { font-style: italic; color: #666; }
strong { font-weight: 600; }

/* Print optimizations */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`
