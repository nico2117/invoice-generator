import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...nextCoreWebVitals,
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**'] }
]

export default config
