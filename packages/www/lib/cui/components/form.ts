import { Component } from '../component'
import { Stack } from './stack'
import { Flex } from './flex'
import { Input, type ValidationResult } from './input'
import { useState } from '../hooks'
import { dimensions } from '../render'
import { useModalKeyboardHandlers } from '../keyboard'

export type FieldConfig<T extends Record<string, any>> = {
  [K in keyof T]: {
    label?: string
    placeholder?: string
    validate?: (value: string) => ValidationResult
    required?: boolean
  }
}

export type FormState<T extends Record<string, any>> = {
  values: T
  errors: Partial<Record<keyof T, string>>
}

type FormProps<T extends Record<string, any>> = {
  fields: FieldConfig<T>
  state: FormState<T>
  width?: number
  columns?: number
  columnGap?: number
  onChange?: (state: FormState<T>) => void
  onSubmit?: (state: FormState<T>) => void
  onCancel?: () => void
}

function validateRequired(label: string, value: string): ValidationResult {
  return {
    valid: value.length > 0,
    message: value.length === 0 ? `${label} is required` : undefined,
  }
}

export const Form = Component<FormProps<any>>((props) => {
  const {
    fields,
    state,
    width = dimensions.width,
    columns = 1,
    columnGap = 2,
    onChange,
    onSubmit,
    onCancel,
  } = props

  const [focusedField, setFocusedField] = useState<string | undefined>(
    Object.keys(fields)[0],
  )

  // Only register form-level handlers when no field is focused
  if (!focusedField && onCancel) {
    useModalKeyboardHandlers([
      {
        keys: ['Escape'],
        handler: (e) => {
          e.preventDefault()
          onCancel()
        },
        stopPropagation: true,
      },
    ])
  }

  // Calculate column widths
  const totalGapWidth = (columns - 1) * columnGap
  const columnWidth = width
    ? Math.floor((width - totalGapWidth) / columns)
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

  const handleTab = (currentField: string, shift: boolean) => {
    const fieldKeys = Object.keys(fields)
    const currentIndex = fieldKeys.indexOf(currentField)
    const delta = shift ? -1 : 1
    const nextIndex =
      (currentIndex + delta + fieldKeys.length) % fieldKeys.length
    const nextField = fieldKeys[nextIndex]
    setFocusedField(nextField)
  }

  const handleEnter = () => {
    const errors: Partial<Record<string, string>> = {}
    let hasErrors = false

    Object.entries(fields).forEach(([key, config]) => {
      const value = state.values[key]?.toString() || ''
      const validate = config.required
        ? (value: string) => {
            const required = validateRequired(config.label ?? key, value)
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
      onChange?.({ ...state, errors })
    } else {
      onSubmit?.(state)
    }
  }

  return Flex({
    gap: columnGap,
    width,
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
            onChange: (value, error) => {
              onChange?.({
                values: { ...state.values, [key]: value },
                errors: { ...state.errors, [key]: error },
              })
            },
            onFocusChange: (focused) => {
              setFocusedField(focused ? key : undefined)
            },
            parentHandlers:
              focusedField === key
                ? {
                    Tab: (shift) => handleTab(key, shift),
                    Enter: handleEnter,
                    Escape: () => setFocusedField(undefined),
                  }
                : undefined,
          })
        }),
      }),
    ),
  })
})
