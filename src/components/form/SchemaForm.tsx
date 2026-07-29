'use client'

import { useState } from 'react'
import type { TemplateSchema, FieldDef, LineItemsFieldDef } from '@/lib/templates/types'
import { parseGermanNumber } from '@/lib/core/formatting'
import type { FormValues, FormErrors } from './types'
import { TextField } from './TextField'
import { TextareaField } from './TextareaField'
import { SelectField } from './SelectField'
import { DateField } from './DateField'
import { CurrencyField } from './CurrencyField'
import { NumberField } from './NumberField'
import { ContactRefField } from './ContactRefField'
import { LineItemsField } from './LineItemsField'

interface Props {
  schema: TemplateSchema
  initialValues?: FormValues
  onSubmit: (values: FormValues) => void
}

export function SchemaForm({ schema, initialValues = {}, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleContactSelect = (contact: Record<string, string>) => {
    // Fill contact values into form
    const newValues = { ...values }
    for (const [key, val] of Object.entries(contact)) {
      if (val) newValues[key] = val
    }
    setValues(newValues)
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    for (const field of schema.fields) {
      const val = values[field.name]

      if (field.required) {
        if (field.type === 'line-items') {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[field.name] = 'Pflichtfeld'
            isValid = false
          }
        } else if (val === undefined || val === null || val === '') {
          newErrors[field.name] = 'Pflichtfeld'
          isValid = false
        }
      }

      if (val !== undefined && val !== null && val !== '') {
        if (field.type === 'currency' && typeof val === 'string') {
          // If we have a string value, CurrencyField handles validation on blur,
          // but we also need to ensure on submit that it parses properly or is empty.
          // Wait, CurrencyField parses to number on blur if valid. If it's still a string,
          // it might mean it's an un-blurred valid number or an invalid string.
          // Let's do a quick check.
          try {
            parseGermanNumber(val)
          } catch {
            newErrors[field.name] = 'Ungültiger Betrag'
            isValid = false
          }
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(values)
    }
  }

  const renderField = (field: FieldDef | LineItemsFieldDef) => {
    const error = errors[field.name]
    const val = values[field.name]

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            placeholder={field.placeholder}
            value={val as string}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'textarea':
        return (
          <TextareaField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            placeholder={field.placeholder}
            value={val as string}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'select':
        return (
          <SelectField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            options={field.options}
            value={val as string}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'date':
        return (
          <DateField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            placeholder={field.placeholder}
            value={val as string}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'currency':
        return (
          <CurrencyField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            placeholder={field.placeholder}
            value={val as string | number}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'number':
        return (
          <NumberField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            placeholder={field.placeholder}
            value={val as string | number}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      case 'contact-ref':
        return (
          <ContactRefField
            key={field.name}
            name={field.name}
            label={field.label}
            required={field.required}
            error={error}
            help={field.help}
            onSelect={handleContactSelect}
          />
        )
      case 'line-items': {
        const lf = field as LineItemsFieldDef
        return (
          <LineItemsField
            key={field.name}
            label={field.label}
            columns={lf.columns}
            min={lf.min}
            max={lf.max}
            error={error}
            value={val as Record<string, unknown>[]}
            onChange={(v) => handleChange(field.name, v)}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div>
        <h2 className="text-xl font-semibold mb-1">{schema.title}</h2>
        {schema.description && <p className="text-gray-600 mb-4">{schema.description}</p>}
      </div>

      <div className="flex flex-col gap-5">
        {schema.fields.map(renderField)}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
        >
          Absenden
        </button>
      </div>
    </form>
  )
}
