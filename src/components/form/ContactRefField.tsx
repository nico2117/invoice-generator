'use client'

import { useState, useEffect, useRef } from 'react'
import type { FormFieldProps } from './types'

interface Props extends FormFieldProps {
  onSelect: (contact: Record<string, string>) => void
}

export function ContactRefField({ name, label, required, error, help, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, string>[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(Array.isArray(data) ? data : [])
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Failed to fetch contacts', err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query])

  const handleSelect = (contact: Record<string, string>) => {
    onSelect(contact)
    setIsOpen(false)
    setQuery('') // Reset query after selection
  }

  return (
    <div className="flex flex-col gap-1 relative">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Pflichtfeld">*</span>}
      </label>
      <input
        id={name}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        placeholder="Kontakt suchen..."
        className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {isLoading && (
        <div className="absolute right-3 top-[34px] text-gray-400 text-sm">Lädt...</div>
      )}
      
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded-md mt-1 top-full max-h-60 overflow-y-auto">
          {results.map((contact, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onMouseDown={() => handleSelect(contact)}
            >
              <div className="font-medium">{contact.name || contact.firma || 'Unbekannt'}</div>
              <div className="text-xs text-gray-500">
                {[contact.strasse, contact.plz, contact.ort].filter(Boolean).join(', ')}
              </div>
            </li>
          ))}
        </ul>
      )}
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
