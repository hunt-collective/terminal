import { Component } from '../component'
import { Stack } from './stack'
import { Flex } from './flex'
import { handleInputEvent, Input, type ValidationResult } from './input'
import { type Message } from '../events'

export type FieldConfig<T extends Record<string, any>> = {
  [K in keyof T]: {
    label?: string
    placeholder?: string
    validate?: (value: string) => ValidationResult
    required?: boolean
  }
}

export type FormState<T extends Record<string, any>> = {
  focusedField?: keyof T
  values: T
  errors: Partial<Record<keyof T, string>>
}

type FormProps<T extends Record<string, any>> = {
  fields: FieldConfig<T>
  state: FormState<T>
  width?: number
  columns?: number
  columnGap?: number
}

function validateRequired(label: string, value: string): ValidationResult {
  return {
    valid: value.length > 0,
    message: value.length === 0 ? `${label} is required` : undefined,
  }
}

export const Form = Component<FormProps<any>>((props) => {
  const { fields, state, columns = 1, columnGap = 2 } = props

  const focusedField = state.focusedField || Object.keys(fields)[0]

  // Calculate column widths
  const totalGapWidth = (columns - 1) * columnGap
  const columnWidth = props.width
    ? Math.floor((props.width - totalGapWidth) / columns)
    : undefined

  // Distribute fields evenly across columns
  const fieldsArray = Object.entries(fields)
  const fieldsPerColumn = Math.ceil(fieldsArray.length / columns)
  const columnFields = Array.from({ length: columns }, (_, columnIndex) =>
    fieldsArray.slice(
      columnIndex * fieldsPerColumn,
      (columnIndex + 1) * fieldsPerColumn,
    ),
  )

  return Flex({
    gap: columnGap,
    children: columnFields.map((fieldsInColumn) =>
      Stack({
        gap: 1,
        width: columnWidth,
        children: fieldsInColumn.map(([key, config]) => {
          const validate = config.required
            ? (value: string) => {
                const required = validateRequired(config.label ?? key, value)
                if (!required.valid) return required
                return config.validate
                  ? config.validate(value)
                  : { valid: true }
              }
            : config.validate

          return Input({
            label: config.label ?? key,
            placeholder: config.placeholder,
            value: state.values[key] || '',
            focused: focusedField === key,
            error: state.errors[key],
            validate,
          })
        }),
      }),
    ),
  })
})

export function handleFormUpdate<T extends Record<string, any>>(
  msg: Message,
  state: FormState<T>,
  fields: FieldConfig<T>,
): FormState<T> | undefined {
  if (msg.type !== 'browser:keydown') return

  msg.event.preventDefault()

  const { key } = msg.event
  const fieldKeys = Object.keys(fields) as (keyof T)[]
  const currentField = state.focusedField || fieldKeys[0]

  switch (key.toLowerCase()) {
    case 'tab': {
      if (!currentField) return { ...state, focusedField: fieldKeys[0] }

      const currentIndex = fieldKeys.indexOf(currentField)
      const delta = msg.event.shiftKey ? -1 : 1
      const nextIndex =
        (currentIndex + delta + fieldKeys.length) % fieldKeys.length
      const nextField = fieldKeys[nextIndex]

      return { ...state, focusedField: nextField }
    }

    case 'escape':
      if (currentField) {
        return { ...state, focusedField: undefined }
      }
      break

    case 'enter': {
      const errors: Partial<Record<keyof T, string>> = {}
      let hasErrors = false

      fieldKeys.forEach((key) => {
        const config = fields[key]
        const value = state.values[key]?.toString() || ''
        const validate = config.required
          ? (value: string) => {
              const required = validateRequired(
                config.label ?? (key as string),
                value,
              )
              if (!required.valid) return required
              return config.validate ? config.validate(value) : { valid: true }
            }
          : config.validate

        if (validate) {
          const result = validate(value)
          if (!result.valid) {
            errors[key] = result.message || 'invalid value'
            hasErrors = true
          }
        }
      })

      if (hasErrors) {
        return { ...state, errors }
      }

      return { ...state, focusedField: undefined, errors: {} }
    }

    default: {
      if (currentField) {
        const config = fields[currentField]
        const currentValue = state.values[currentField]?.toString() || ''
        const validate = config.required
          ? (value: string) => {
              const required = validateRequired(config.label ?? key, value)
              if (!required.valid) return required
              return config.validate ? config.validate(value) : { valid: true }
            }
          : config.validate

        const { value, error } = handleInputEvent(
          msg.event,
          currentValue,
          undefined,
          validate,
        )

        return {
          ...state,
          values: { ...state.values, [currentField]: value },
          errors: { ...state.errors, [currentField]: error },
        }
      }
    }
  }
}
