export type FormValues = Record<string, unknown>
export type FormErrors = Record<string, string>

export interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  error?: string
  help?: string
}
