import type { TemplateSchema } from '../types'

export const spendenbestaetigungSchema: TemplateSchema = {
  id: 'spendenbestaetigung',
  title: 'Spendenbestätigung',
  description: 'Bestätigung einer erhaltenen Spende',
  markdownFile: 'spendenbestaetigung/template.md',
  fields: [
    { name: 'firmenname', label: 'Firmenname / Name', type: 'text', required: true },
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
    { name: 'datum', label: 'Ausstellungsdatum', type: 'date', required: true },
    { name: 'jahr', label: 'Jahr', type: 'number', required: true },
    { name: 'rechnungsnummer', label: 'Dokumentnummer', type: 'number', required: true },
    { name: 'spendendatum', label: 'Spendendatum (Eingang)', type: 'date', required: true },
    { name: 'betrag', label: 'Betrag (EUR)', type: 'currency', required: true },
    { name: 'verwendungszweck', label: 'Verwendungszweck', type: 'textarea', required: false },
  ],
  derived: [
    { name: 'anrede_gruss', from: 'anrede', description: 'Derived salutation' },
  ],
}
