import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate } from './registry'
import { SETTINGS_PLACEHOLDER_KEYS } from './types'
import type { TemplateSchema, LineItemsFieldDef } from './types'

describe('template registry', () => {
  it('getTemplate returns the correct schema by id', () => {
    const t = getTemplate('sponsoring')
    expect(t).toBeDefined()
    expect(t?.id).toBe('sponsoring')
  })

  it('getTemplate returns undefined (not throws) for unknown id', () => {
    expect(getTemplate('unknown-id-xyz')).toBeUndefined()
  })

  it('TEMPLATES contains exactly 3 entries', () => {
    expect(Object.keys(TEMPLATES)).toHaveLength(3)
    expect(Object.keys(TEMPLATES)).toContain('sponsoring')
    expect(Object.keys(TEMPLATES)).toContain('freie-rechnung')
    expect(Object.keys(TEMPLATES)).toContain('spendenbestaetigung')
  })

  it('SETTINGS_PLACEHOLDER_KEYS contains all expected keys', () => {
    expect(SETTINGS_PLACEHOLDER_KEYS).toContain('verein.name')
    expect(SETTINGS_PLACEHOLDER_KEYS).toContain('bank.iban')
    expect(SETTINGS_PLACEHOLDER_KEYS).toContain('verein.zvrZahl')
    expect(SETTINGS_PLACEHOLDER_KEYS).toHaveLength(13)
  })

  it('LineItemsFieldDef can express a line-items column structure without any cast', () => {
    const fieldDef: LineItemsFieldDef = {
      name: 'positionen',
      label: 'Positionen',
      type: 'line-items',
      required: true,
      min: 1,
      columns: [
        { name: 'beschreibung', label: 'Beschreibung', type: 'text', required: true },
        { name: 'menge', label: 'Menge', type: 'number', required: true },
        { name: 'einzelpreis', label: 'Einzelpreis', type: 'currency', required: true },
      ],
    }
    // If this compiles without error, the type is expressive enough
    const schema: TemplateSchema = {
      id: 'test',
      title: 'Test',
      markdownFile: 'test/template.md',
      fields: [fieldDef],
    }
    expect(schema.fields[0].type).toBe('line-items')
    const lif = schema.fields[0] as LineItemsFieldDef
    expect(lif.columns).toHaveLength(3)
  })
})
