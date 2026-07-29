/**
 * Central type contract for the invoice generator.
 * Every form, CSV validator, and template renderer reads from these types.
 * Do NOT import from src/lib/core/ or src/lib/render/ — those don't exist yet.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'date'
  | 'currency'
  | 'number'
  | 'contact-ref'
  | 'line-items'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldDef {
  name: string
  label: string           // German label shown in the form
  type: FieldType
  required?: boolean
  placeholder?: string
  help?: string
  options?: SelectOption[] // only for type 'select'
  defaultValue?: unknown
}

export interface LineItemsFieldDef extends FieldDef {
  type: 'line-items'
  columns: FieldDef[]
  min?: number
  max?: number
}

export interface DerivedDef {
  /** The placeholder key this derived value produces, e.g. "anrede_gruss" */
  name: string
  /** Source field name(s) this is derived from */
  from: string | string[]
  /** Human description for debugging / validation messages */
  description?: string
}

export interface TemplateSchema {
  id: string
  title: string           // German title shown in the UI
  description?: string
  markdownFile: string    // relative path from templates directory, e.g. "sponsoring/template.md"
  fields: (FieldDef | LineItemsFieldDef)[]
  derived?: DerivedDef[]
  filenamePrefix?: string
}

/**
 * All settings-sourced placeholder paths available to templates.
 * These are supplied by getSettingsSnapshot() and do NOT appear in template field schemas.
 * validateTemplateConsistency() uses this as its third argument to avoid false positives.
 */
export const SETTINGS_PLACEHOLDER_KEYS = [
  'verein.name',
  'verein.strasse',
  'verein.plz',
  'verein.ort',
  'verein.zvrZahl',
  'verein.kleinunternehmerHinweis',
  'verein.sig1Name',
  'verein.sig1Rolle',
  'verein.sig2Name',
  'verein.sig2Rolle',
  'bank.name',
  'bank.iban',
  'bank.bic',
] as const

export type SettingsPlaceholderKey = (typeof SETTINGS_PLACEHOLDER_KEYS)[number]
