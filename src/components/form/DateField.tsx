'use client'

import { useState } from 'react'
import type { FormFieldProps } from './types'

interface Props extends FormFieldProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function DateField({ name, label, required, error: externalError, help, value, onChange, placeholder }: Props) {
  const [localValue, setLocalValue] = useState(value ?? '')
  const [internalError, setInternalError] = useState<string | null>(null)

  const validate = (val: string) => {
    if (!val && !required) {
      setInternalError(null)
      return true
    }
    const regex = /^\d{2}\.\d{2}\.\d{4}$/
    if (!regex.test(val)) {
      setInternalError('Ungültiges Datum (TT.MM.JJJJ)')
      return false
    }
    // basic date logic
    const [d, m, y] = val.split('.').map(Number)
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      setInternalError('Ungültiges Datum (TT.MM.JJJJ)')
      return false
    }
    setInternalError(null)
    return true
  }

  const handleBlur = () => {
    if (validate(localValue)) {
      onChange?.(localValue)
    } else {
      onChange?.(localValue) // let parent handle it or keep it
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dVal = e.target.value
    if (!dVal) return
    const [y, m, d] = dVal.split('-')
    if (y && m && d) {
      const formatted = `${d}.${m}.${y}`
      setLocalValue(formatted)
      onChange?.(formatted)
      setInternalError(null)
    }
  }

  // To show in the date picker, value must be YYYY-MM-DD
  const getDateValue = () => {
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(localValue)) {
      const [d, m, y] = localValue.split('.')
      return `${y}-${m}-${d}`
    }
    return ''
  }

  const error = externalError || internalError

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Pflichtfeld">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          id={name}
          type="text"
          name={name}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder || 'TT.MM.JJJJ'}
          className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <input
          type="date"
          value={getDateValue()}
          onChange={handleDateChange}
          className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
