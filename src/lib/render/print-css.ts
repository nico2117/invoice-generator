import fs from 'fs';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'src', 'assets', 'fonts');
const regularBase64 = fs.readFileSync(path.join(fontsDir, 'DejaVuSans.ttf')).toString('base64');
const boldBase64 = fs.readFileSync(path.join(fontsDir, 'DejaVuSans-Bold.ttf')).toString('base64');

export const PRINT_CSS = `
@page { size: A4; margin: 0; }
/* Puppeteer supplies 15mm top/bottom, 20mm left/right — do NOT add margins here */

@font-face {
  font-family: 'DejaVu Sans';
  font-style: normal;
  font-weight: normal;
  src: url('data:font/truetype;base64,${regularBase64}') format('truetype');
}

@font-face {
  font-family: 'DejaVu Sans';
  font-style: normal;
  font-weight: bold;
  src: url('data:font/truetype;base64,${boldBase64}') format('truetype');
}

*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: 'DejaVu Sans', sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  color: #000;
  margin: 0;
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #000;
  padding-bottom: 8pt;
  margin-bottom: 12pt;
}

.logo { height: 60px; width: auto; }

.sender-info {
  text-align: right;
  font-size: 9pt;
  line-height: 1.4;
}

.meta-right {
  text-align: right;
  margin-bottom: 16pt;
}

h1 {
  font-size: 14pt;
  font-weight: bold;
  margin: 0 0 8pt 0;
}

h2 {
  font-size: 12pt;
  font-weight: bold;
  margin: 12pt 0 6pt 0;
}

p { margin: 0 0 6pt 0; }

hr {
  border: none;
  border-top: 1px solid #000;
  margin: 12pt 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 8pt 0;
}

th, td {
  padding: 4pt 6pt;
  border-bottom: 1px solid #ccc;
  text-align: left;
  font-size: 10pt;
}

th { font-weight: bold; border-bottom: 2px solid #000; }

/* Last column right-aligned (amounts) */
th:last-child, td:last-child { text-align: right; }

/* Prevent table and signatures from splitting across pages */
table { break-inside: auto; }
tr { break-inside: avoid; }

.signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 25mm;
  break-inside: avoid;
}

.sig {
  display: flex;
  flex-direction: column;
  min-width: 120pt;
}

.sig .name {
  border-top: 1px solid #000;
  padding-top: 4pt;
  font-weight: bold;
}

.sig .role {
  font-size: 9pt;
  margin-top: 2pt;
}

em, i { font-style: italic; }
strong, b { font-weight: bold; }

@media print {
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`;
