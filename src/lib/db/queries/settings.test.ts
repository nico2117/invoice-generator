import { describe, it, expect } from 'vitest'
import { SETTINGS_PLACEHOLDER_KEYS } from '@/lib/templates/types'

describe('getSettingsSnapshot shape contract', () => {
  it('snapshot type covers every SETTINGS_PLACEHOLDER_KEY', () => {
    // Build a mock snapshot matching the getSettingsSnapshot return shape
    const mockSnapshot = {
      verein: {
        name: 'Test',
        strasse: 'Test',
        plz: '1234',
        ort: 'Test',
        zvrZahl: '12345',
        kleinunternehmerHinweis: 'Test',
        sig1Name: 'Test',
        sig1Rolle: 'Test',
        sig2Name: 'Test',
        sig2Rolle: 'Test',
      },
      bank: {
        name: 'Test',
        iban: 'Test',
        bic: 'Test',
      },
    }

    // Every SETTINGS_PLACEHOLDER_KEY must resolve in the snapshot
    for (const key of SETTINGS_PLACEHOLDER_KEYS) {
      const parts = key.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = mockSnapshot
      for (const part of parts) {
        expect(obj).toHaveProperty(part)
        obj = obj[part]
      }
    }
  })
})
