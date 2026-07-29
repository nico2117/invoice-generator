'use client'

import type { FormFieldProps } from './types'
import type { SelectOption } from '@/lib/templates/types'

interface Props extends FormFieldProps {
  value?: string
  onChange?: (value: string) => void
  options?: SelectOption[]
}

export function SelectField({ name, label, required, error, help, value, onChange, options = [] }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Pflichtfeld">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="" disabled hidden>Bitte wählen...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
