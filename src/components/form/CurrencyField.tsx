'use client'

import { useState, useEffect } from 'react'
import type { FormFieldProps } from './types'
import { parseGermanNumber, formatCurrency } from '@/lib/core/formatting'

interface Props extends FormFieldProps {
  value?: string | number
  onChange?: (value: string | number) => void
  placeholder?: string
}

export function CurrencyField({ name, label, required, error: externalError, help, value, onChange, placeholder }: Props) {
  const [localValue, setLocalValue] = useState<string>('')
  const [internalError, setInternalError] = useState<string | null>(null)

  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'number') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalValue(formatCurrency(value))
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalValue(String(value))
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalValue('')
    }
  }, [value])

  const handleBlur = () => {
    if (!localValue.trim() && !required) {
      setInternalError(null)
      onChange?.(localValue)
      return
    }
    if (!localValue.trim() && required) {
      setInternalError(null) // Let external validation handle required
      onChange?.(localValue)
      return
    }

    try {
      const parsed = parseGermanNumber(localValue)
      const formatted = formatCurrency(parsed)
      setLocalValue(formatted)
      setInternalError(null)
      onChange?.(parsed)
    } catch {
      setInternalError('Ungültiger Betrag')
      onChange?.(localValue) // keep raw value so parent knows it's invalid if it wants to validate
    }
  }

  const error = externalError || internalError

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Pflichtfeld">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type="text"
          name={name}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder || '0,00'}
          className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500">€</span>
        </div>
      </div>
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
