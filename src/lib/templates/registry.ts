import type { TemplateSchema } from './types'
import { sponsoringSchema } from './sponsoring/schema'
import { freieRechnungSchema } from './freie-rechnung/schema'
import { spendenbestaetigungSchema } from './spendenbestaetigung/schema'

export const TEMPLATES: Record<string, TemplateSchema> = {
  [sponsoringSchema.id]: sponsoringSchema,
  [freieRechnungSchema.id]: freieRechnungSchema,
  [spendenbestaetigungSchema.id]: spendenbestaetigungSchema,
}

export function getTemplate(id: string): TemplateSchema | undefined {
  return TEMPLATES[id]
}
