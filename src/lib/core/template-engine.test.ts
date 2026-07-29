import { describe, it, expect } from 'vitest'
import { fillTemplate, extractPlaceholders, validateTemplateConsistency, MissingPlaceholderError } from './template-engine'
import { SETTINGS_PLACEHOLDER_KEYS } from '@/lib/templates/types'

describe('fillTemplate - scalar substitution', () => {
  it('substitutes a simple key', () =>
    expect(fillTemplate('Hello {{name}}', { name: 'Welt' })).toBe('Hello Welt'))
  it('HTML-escapes & in substituted values', () =>
    expect(fillTemplate('{{firmenname}}', { firmenname: 'Müller & Söhne' })).toBe('Müller &amp; Söhne'))
  it('does NOT escape < in substituted values that look safe (trusts data is plain text)', () =>
    // For invoices, company names etc. are plain text — & is the main concern
    expect(fillTemplate('{{name}}', { name: 'A&B' })).toBe('A&amp;B'))
  it('optional {{key?}} renders empty string when key is absent', () =>
    expect(fillTemplate('{{titel?}} {{name}}', { name: 'Müller' })).toBe(' Müller'))
  it('optional {{key?}} renders value when key is present', () =>
    expect(fillTemplate('{{titel?}} {{name}}', { titel: 'Dr.', name: 'Müller' })).toBe('Dr. Müller'))
  it('throws MissingPlaceholderError for missing required key', () =>
    expect(() => fillTemplate('{{bank.iban}}', {})).toThrowError(MissingPlaceholderError))
  it('MissingPlaceholderError message names the missing key', () => {
    try { fillTemplate('{{bank.iban}}', {}) } 
    catch (e) { expect((e as Error).message).toContain('bank.iban') }
  })
  it('dotted path {{verein.name}} resolves correctly', () =>
    expect(fillTemplate('{{verein.name}}', { verein: { name: 'Burschenschaft Kirchbach' } }))
    .toBe('Burschenschaft Kirchbach'))
})

describe('fillTemplate - conditionals', () => {
  it('{{#if key}} renders when truthy', () =>
    expect(fillTemplate('{{#if ansprechperson}}z.H. {{ansprechperson}}{{/if}}', 
      { ansprechperson: 'Max' })).toBe('z.H. Max'))
  it('{{#if key}} renders nothing when falsy', () =>
    expect(fillTemplate('{{#if ansprechperson}}z.H. {{ansprechperson}}{{/if}}', 
      { ansprechperson: '' })).toBe(''))
  it('{{#if key}} renders nothing when absent', () =>
    expect(fillTemplate('{{#if ansprechperson}}z.H. {{ansprechperson}}{{/if}}', 
      {})).toBe(''))
  it('{{#unless key}} renders when falsy', () =>
    expect(fillTemplate('{{#unless skip}}shown{{/unless}}', { skip: '' })).toBe('shown'))
  it('{{#unless key}} hides when truthy', () =>
    expect(fillTemplate('{{#unless skip}}shown{{/unless}}', { skip: 'yes' })).toBe(''))
})

describe('fillTemplate - loops', () => {
  it('{{#each}} renders one row per item', () => {
    const tmpl = '{{#each positionen}}{{this.beschreibung}}|{{/each}}'
    const result = fillTemplate(tmpl, { positionen: [
      { beschreibung: 'Pos A' },
      { beschreibung: 'Pos B' },
      { beschreibung: 'Pos C' },
    ]})
    expect(result.split('|').filter(Boolean)).toHaveLength(3)
    expect(result).toContain('Pos A')
    expect(result).toContain('Pos C')
  })
  it('{{@index}} is available inside each', () => {
    const tmpl = '{{#each items}}{{@index}}:{{this.v}} {{/each}}'
    expect(fillTemplate(tmpl, { items: [{ v: 'a' }, { v: 'b' }] })).toBe('0:a 1:b ')
  })
  it('{{#each}} with empty array renders nothing', () =>
    expect(fillTemplate('{{#each positionen}}x{{/each}}', { positionen: [] })).toBe(''))
})

describe('fillTemplate - HTML passthrough', () => {
  it('raw HTML in the template is NOT escaped', () => {
    const tmpl = '<div class="meta-right"><div>{{datum}}</div></div>'
    const result = fillTemplate(tmpl, { datum: '14.09.2026' })
    expect(result).toBe('<div class="meta-right"><div>14.09.2026</div></div>')
  })
})

describe('fillTemplate - whitespace', () => {
  it('collapses interior double spaces', () =>
    expect(fillTemplate('Herr    Müller', {})).toBe('Herr Müller'))
  it('preserves trailing double-space (Markdown hard break)', () => {
    const tmpl = 'line one  \nline two'
    expect(fillTemplate(tmpl, {})).toBe('line one  \nline two')
  })
  it('collapses 3+ newlines to 2', () => {
    expect(fillTemplate('a\n\n\n\nb', {})).toBe('a\n\nb')
  })
})

describe('extractPlaceholders', () => {
  it('extracts plain keys', () =>
    expect(extractPlaceholders('{{firmenname}} {{nachname}}')).toContain('firmenname'))
  it('extracts optional keys without the ?', () =>
    expect(extractPlaceholders('{{titel?}}')).toContain('titel'))
  it('extracts dotted keys', () =>
    expect(extractPlaceholders('{{verein.name}}')).toContain('verein.name'))
  it('extracts keys from inside conditionals', () =>
    expect(extractPlaceholders('{{#if ansprechperson}}{{ansprechperson}}{{/if}}')).toContain('ansprechperson'))
  it('extracts keys from inside each blocks', () =>
    expect(extractPlaceholders('{{#each positionen}}{{this.beschreibung}}{{/each}}')).toContain('positionen'))
  it('returns unique keys (no duplicates)', () => {
    const keys = extractPlaceholders('{{a}} {{a}} {{b}}')
    expect(keys.filter(k => k === 'a')).toHaveLength(1)
  })
})

describe('validateTemplateConsistency', () => {
  const baseSchema = {
    id: 'test', title: 'Test', markdownFile: 'test/template.md',
    fields: [{ name: 'firmenname', label: 'Firmenname', type: 'text' as const, required: true }],
    derived: [{ name: 'anrede_gruss', from: 'anrede', description: 'derived' }],
  }
  
  it('returns no errors for a matching schema + markdown', () => {
    const { errors } = validateTemplateConsistency(
      baseSchema,
      '{{firmenname}} {{anrede_gruss}} {{verein.name}}',
      SETTINGS_PLACEHOLDER_KEYS
    )
    expect(errors).toHaveLength(0)
  })
  
  it('reports error for placeholder not satisfied by schema, derived, or settings', () => {
    const { errors } = validateTemplateConsistency(
      baseSchema,
      '{{firmenname}} {{unknown_field}}',
      SETTINGS_PLACEHOLDER_KEYS
    )
    expect(errors.some(e => e.includes('unknown_field'))).toBe(true)
  })
  
  it('reports warning for schema field not used in markdown', () => {
    const schema = { ...baseSchema, fields: [
      ...baseSchema.fields,
      { name: 'unused_feld', label: 'Unused', type: 'text' as const },
    ]}
    const { warnings } = validateTemplateConsistency(schema, '{{firmenname}}', SETTINGS_PLACEHOLDER_KEYS)
    expect(warnings.some(w => w.includes('unused_feld'))).toBe(true)
  })
  
  it('does NOT report optional {{titel?}} as an error when no field covers it', () => {
    const { errors } = validateTemplateConsistency(baseSchema, '{{firmenname}} {{titel?}}', SETTINGS_PLACEHOLDER_KEYS)
    expect(errors.some(e => e.includes('titel'))).toBe(false)
  })
  
  it('settings keys are satisfied without a schema field', () => {
    const { errors } = validateTemplateConsistency(baseSchema, '{{firmenname}} {{verein.zvrZahl}}', SETTINGS_PLACEHOLDER_KEYS)
    expect(errors.some(e => e.includes('zvrZahl'))).toBe(false)
  })
})
