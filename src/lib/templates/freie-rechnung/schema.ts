import type { TemplateSchema } from '../types'

export const freieRechnungSchema: TemplateSchema = {
  id: 'freie-rechnung',
  title: 'Freie Rechnung',
  description: 'Rechnung mit frei definierbaren Positionen',
  markdownFile: 'freie-rechnung/template.md',
  fields: [
    { name: 'firmenname', label: 'Firmenname', type: 'text', required: true },
    { name: 'anrede', label: 'Anrede', type: 'select', required: true, options: [
      { value: 'Herrn', label: 'Herrn' },
      { value: 'Frau', label: 'Frau' },
    ]},
    { name: 'titel', label: 'Titel', type: 'text', required: false },
    { name: 'ansprechperson', label: 'Ansprechperson', type: 'text', required: false },
    { name: 'nachname', label: 'Nachname', type: 'text', required: true },
    { name: 'strasse', label: 'Straße', type: 'text', required: true },
    { name: 'hausnummer', label: 'Hausnummer', type: 'text', required: true },
    { name: 'plz', label: 'PLZ', type: 'text', required: true },
    { name: 'ort', label: 'Ort', type: 'text', required: true },
    { name: 'datum', label: 'Datum', type: 'date', required: true },
    { name: 'jahr', label: 'Jahr', type: 'number', required: true },
    { name: 'rechnungsnummer', label: 'Rechnungsnummer', type: 'number', required: true },
    { name: 'betreff', label: 'Betreff', type: 'text', required: true },
    { name: 'einleitung', label: 'Einleitung', type: 'textarea', required: false },
    {
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
    } as import('../types').LineItemsFieldDef,
  ],
  derived: [
    { name: 'anrede_gruss', from: 'anrede', description: 'Derived salutation' },
    { name: 'positionen[].summe', from: ['positionen[].menge', 'positionen[].einzelpreis'], description: 'Row total = menge × einzelpreis, formatted' },
    { name: 'gesamtbetrag', from: 'positionen', description: 'Sum of all row totals' },
  ],
}
