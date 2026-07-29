import type { TemplateSchema } from '@/lib/templates/types'

export class MissingPlaceholderError extends Error {
  constructor(key: string) {
    super(`Missing required placeholder: {{${key}}}`)
    this.name = 'MissingPlaceholderError'
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((obj, key) => 
    (obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined), data)
}

export function fillTemplate(template: string, data: Record<string, unknown>): string {
  let result = template

  // 1. Process {{#each}} ... {{/each}}
  result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, content) => {
    const list = resolvePath(data, key)
    if (!Array.isArray(list)) return ''
    return list.map((item, index) => {
      const localData = typeof item === 'object' && item !== null ? { ...data, ...item } : data
      let localContent = content.replace(/\{\{@index\}\}/g, String(index))
      localContent = localContent.replace(/\{\{this\.([^}]+)\}\}/g, (__: string, p1: string) => `{{${p1}}}`)
      return fillTemplate(localContent, localData)
    }).join('')
  })

  // 2. Process {{#if}} ... {{/if}}
  result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const val = resolvePath(data, key)
    if (val) return fillTemplate(content, data)
    return ''
  })

  // 3. Process {{#unless}} ... {{/unless}}
  result = result.replace(/\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, key, content) => {
    const val = resolvePath(data, key)
    if (!val) return fillTemplate(content, data)
    return ''
  })

  // 4. Scalar substitution {{key}} or {{key?}}
  result = result.replace(/\{\{([^#}]+?)\}\}/g, (_, keyWithOptional) => {
    const isOptional = keyWithOptional.endsWith('?')
    const key = isOptional ? keyWithOptional.slice(0, -1) : keyWithOptional
    const val = resolvePath(data, key)
    
    if (val === undefined || val === null) {
      if (isOptional) return ''
      throw new MissingPlaceholderError(key)
    }
    
    return escapeHtml(String(val))
  })

  // 5. Whitespace policy
  // Collapse interior spaces
  result = result.replace(/(\S) {2,}(?=\S)/g, '$1 ')
  // Collapse 3+ newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

export function extractPlaceholders(template: string): string[] {
  const keys = new Set<string>()
  const regex = /\{\{(.*?)\}\}/g
  let match
  while ((match = regex.exec(template)) !== null) {
    const raw = match[1].trim()
    if (raw.startsWith('/') || raw.startsWith('@index') || raw.startsWith('this.')) continue
    
    if (raw.startsWith('#if ') || raw.startsWith('#unless ') || raw.startsWith('#each ')) {
      keys.add(raw.split(/\s+/)[1])
    } else {
      keys.add(raw.endsWith('?') ? raw.slice(0, -1) : raw)
    }
  }
  return Array.from(keys)
}

export function validateTemplateConsistency(
  schema: TemplateSchema,
  markdown: string,
  allowedSettingsKeys: readonly string[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const requiredPlaceholders = new Set<string>()
  const allPlaceholders = new Set<string>()
  
  const regex = /\{\{(.*?)\}\}/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const raw = match[1].trim()
    if (raw.startsWith('/') || raw.startsWith('@index') || raw.startsWith('this.')) continue
    
    let key = ''
    if (raw.startsWith('#if ') || raw.startsWith('#unless ') || raw.startsWith('#each ')) {
      key = raw.split(/\s+/)[1]
      requiredPlaceholders.add(key)
      allPlaceholders.add(key)
    } else {
      key = raw.endsWith('?') ? raw.slice(0, -1) : raw
      allPlaceholders.add(key)
      if (!raw.endsWith('?')) {
        requiredPlaceholders.add(key)
      }
    }
  }

  const validKeys = new Set<string>([
    ...(schema.fields?.map(f => f.name) || []),
    ...(schema.derived?.map(d => d.name) || []),
    ...allowedSettingsKeys
  ])

  for (const placeholder of requiredPlaceholders) {
    // Check if the placeholder or its base object (e.g., verein from verein.name) is valid
    const baseKey = placeholder.split('.')[0]
    if (!validKeys.has(placeholder) && !validKeys.has(baseKey)) {
      errors.push(`Missing field for required placeholder: {{${placeholder}}}`)
    }
  }

  const schemaFields = schema.fields?.map(f => f.name) || []
  for (const field of schemaFields) {
    let isUsed = false
    for (const placeholder of allPlaceholders) {
      if (placeholder === field || placeholder.startsWith(`${field}.`)) {
        isUsed = true
        break
      }
    }
    if (!isUsed) {
      warnings.push(`Schema field not used in template: ${field}`)
    }
  }

  return { errors, warnings }
}
