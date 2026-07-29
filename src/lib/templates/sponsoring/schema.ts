import type { TemplateSchema } from '../types'

export const sponsoringSchema: TemplateSchema = {
  id: 'sponsoring',
  title: 'Sponsoring-Rechnung',
  description: 'Rechnung für Sponsoren des Kirchbacher Kirchtags',
  markdownFile: 'sponsoring/template.md',
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
    { name: 'leistung', label: 'Leistung', type: 'textarea', required: true },
    { name: 'betrag', label: 'Betrag', type: 'currency', required: true },
  ],
  derived: [
    { name: 'anrede_gruss', from: 'anrede', description: 'Derived from anrede: Herrn → r Herr, else  Frau' },
  ],
}
