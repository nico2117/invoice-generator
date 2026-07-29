'use client'

import type { FormFieldProps } from './types'

interface Props extends FormFieldProps {
  value?: string | number
  onChange?: (value: number | undefined) => void
  placeholder?: string
}

export function NumberField({ name, label, required, error, help, value, onChange, placeholder }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Pflichtfeld">*</span>}
      </label>
      <input
        id={name}
        type="number"
        name={name}
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value
          onChange?.(val === '' ? undefined : Number(val))
        }}
        placeholder={placeholder}
        className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
