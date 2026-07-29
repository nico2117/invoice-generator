import { describe, it, expect } from 'vitest'
import { buildDocumentHtml } from './html'

const testSettings = {
  vereinsname: 'Testverein XYZ',
  strasse: 'Musterstraße 1',
  plz: '1234',
  ort: 'Testort',
  zvrZahl: '123456789',
  sig1Name: 'Max Mustermann',
  sig1Rolle: 'Obmann',
  sig2Name: 'Erika Musterfrau',
  sig2Rolle: 'Kassier',
  bankname: 'Testbank',
  iban: 'AT12 3456 7890 1234 5678',
  bic: 'TESTBIC1',
  kleinunternehmerHinweis: 'Im Betrag ist keine Vorsteuer enthalten.',
}

describe('buildDocumentHtml', () => {
  it('contains meta charset UTF-8', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).toContain('<meta charset="UTF-8">')
  })
  it('contains html lang=de', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).toContain('lang="de"')
  })
  it('contains PRINT_CSS inlined (not a link)', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).toContain('<style>')
    expect(html).not.toContain('<link')
    expect(html).toContain('DejaVu Sans')  // proves PRINT_CSS is inlined
  })
  it('settings vereinsname appears in sender block', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).toContain('Testverein XYZ')
  })
  it('logo appears as base64 data URI when provided', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: 'data:image/png;base64,abc123' })
    expect(html).toContain('src="data:image/png;base64,abc123"')
  })
  it('no logo img tag when logoDataUri is null', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).not.toContain('<img')
  })
  it('raw HTML in markdown passes through (not escaped)', () => {
    const md = '<div class="meta-right"><div>14.09.2026</div></div>'
    const html = buildDocumentHtml({ markdown: md, settings: testSettings, logoDataUri: null })
    expect(html).toContain('<div class="meta-right">')
    expect(html).not.toContain('&lt;div')
  })
  it('contains no hardcoded Verein name like Kirchbach', () => {
    const html = buildDocumentHtml({ markdown: '# Test', settings: testSettings, logoDataUri: null })
    expect(html).not.toContain('Kirchbach')
    expect(html).not.toContain('Eineter')
    expect(html).not.toContain('AT47')
  })
  it('GFM table in markdown becomes HTML table', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const html = buildDocumentHtml({ markdown: md, settings: testSettings, logoDataUri: null })
    expect(html).toContain('<table>')
  })
})
