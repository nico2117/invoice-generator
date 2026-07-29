'use client'

import type { FieldDef } from '@/lib/templates/types'
import { formatCurrency, parseGermanNumber } from '@/lib/core/formatting'
import { TextField } from './TextField'
import { NumberField } from './NumberField'
import { CurrencyField } from './CurrencyField'

interface Props {
  columns: FieldDef[]
  value?: Record<string, unknown>[]
  onChange?: (value: Record<string, unknown>[]) => void
  min?: number
  max?: number
  label?: string
  error?: string
}

export function LineItemsField({ columns, value = [], onChange, min = 0, max, label, error }: Props) {
  const rows = Array.isArray(value) ? value : []

  const addRow = () => {
    if (max !== undefined && rows.length >= max) return
    const newRow: Record<string, unknown> = {}
    onChange?.([...rows, newRow])
  }

  const removeRow = (index: number) => {
    if (rows.length <= min) return
    const newRows = [...rows]
    newRows.splice(index, 1)
    onChange?.(newRows)
  }

  const updateRow = (index: number, key: string, val: unknown) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [key]: val }
    onChange?.(newRows)
  }

  const calculateRowTotal = (row: Record<string, unknown>) => {
    try {
      const mengeRaw = row['menge']
      const epRaw = row['einzelpreis']
      
      const menge = typeof mengeRaw === 'number' ? mengeRaw : parseGermanNumber(String(mengeRaw || '0'))
      const ep = typeof epRaw === 'number' ? epRaw : parseGermanNumber(String(epRaw || '0'))
      
      return menge * ep
    } catch {
      return 0
    }
  }

  const grandTotal = rows.reduce((sum, row) => sum + calculateRowTotal(row), 0)

  return (
    <div className="flex flex-col gap-4">
      {label && <h3 className="text-lg font-medium text-gray-900">{label}</h3>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.name} className="px-4 py-2 font-medium text-gray-700">
                  {col.label} {col.required && <span className="text-red-500">*</span>}
                </th>
              ))}
              <th className="px-4 py-2 font-medium text-gray-700 text-right">Gesamt</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rowTotal = calculateRowTotal(row)
              return (
                <tr key={index} className="border-b border-gray-100">
                  {columns.map(col => (
                    <td key={col.name} className="px-4 py-2 align-top">
                      {col.type === 'currency' ? (
                        <CurrencyField
                          name={`${col.name}-${index}`}
                          label=""
                          value={row[col.name] as string | number}
                          onChange={(val) => updateRow(index, col.name, val)}
                        />
                      ) : col.type === 'number' ? (
                        <NumberField
                          name={`${col.name}-${index}`}
                          label=""
                          value={row[col.name] as string | number}
                          onChange={(val) => updateRow(index, col.name, val)}
                        />
                      ) : (
                        <TextField
                          name={`${col.name}-${index}`}
                          label=""
                          value={row[col.name] as string}
                          onChange={(val) => updateRow(index, col.name, val)}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2 align-middle text-right font-medium">
                    {formatCurrency(rowTotal)} €
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length <= min}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Entfernen"
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={columns.length} className="px-4 py-3 text-right">Gesamtsumme:</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(grandTotal)} €</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <button
          type="button"
          onClick={addRow}
          disabled={max !== undefined && rows.length >= max}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Zeile hinzufügen
        </button>
      </div>
    </div>
  )
}
