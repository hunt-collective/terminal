import { Component } from '../component'
import { Box, Break, Flex, Stack, Text } from './'
import { styles } from '../render'
import type { Style } from '../style'
import { useModalKeyboardHandlers } from '../keyboard'

export type ValidationResult = {
  valid: boolean
  message?: string
}

export type InputProps = {
  value: string
  focused?: boolean
  label?: string
  placeholder?: string
  style?: Style
  error?: string
  validate?: (value: string) => ValidationResult
  onChange?: (value: string, error?: string) => void
  onFocusChange?: (focused: boolean) => void
  parentHandlers?: {
    Enter?: () => void
    Tab?: (shift: boolean) => void
    Escape?: () => void
  }
}

export const Input = Component<InputProps>((props) => {
  const {
    value,
    focused = false,
    label,
    placeholder = '',
    error,
    validate,
    onChange,
    onFocusChange,
    parentHandlers,
  } = props

  // Only register handlers when focused
  if (focused) {
    useModalKeyboardHandlers([
      // Special key handlers
      {
        keys: ['Backspace'],
        handler: (event: KeyboardEvent) => {
          event.preventDefault()
          const newValue = value.slice(0, -1)
          let newError: string | undefined

          if (validate) {
            const result = validate(newValue)
            if (!result.valid) {
              newError = result.message
            }
          }

          onChange?.(newValue, newError)
        },
        stopPropagation: true,
      },
      // Let parent handle Enter
      {
        keys: ['Enter'],
        handler: (event: KeyboardEvent) => {
          event.preventDefault()
          if (parentHandlers?.Enter) {
            parentHandlers.Enter()
          }
        },
        stopPropagation: true,
      },
      // Let parent handle Tab
      {
        keys: ['Tab'],
        handler: (event: KeyboardEvent) => {
          event.preventDefault()
          if (parentHandlers?.Tab) {
            parentHandlers.Tab(event.shiftKey)
          }
        },
        stopPropagation: true,
      },
      // Let parent handle Escape if provided
      {
        keys: ['Escape'],
        handler: (event: KeyboardEvent) => {
          event.preventDefault()
          if (parentHandlers?.Escape) {
            parentHandlers.Escape()
          } else {
            onFocusChange?.(false)
          }
        },
        stopPropagation: true,
      },
      // Default handler for any printable character
      {
        handler: (event: KeyboardEvent) => {
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault()

            const newValue = value + event.key
            let newError: string | undefined

            if (validate) {
              const result = validate(newValue)
              if (!result.valid) {
                newError = result.message
              }
            }

            onChange?.(newValue, newError)
          }
        },
        priority: 100,
        stopPropagation: true,
      },
    ])
  }

  const displayValue = value || (!focused ? placeholder : '')
  const cursor = focused ? '█' : ' '

  const inputContent = Box({
    padding: { x: 1 },
    border: true,
    borderStyle: {
      color: error
        ? { color: '#ff4444' }
        : focused
          ? styles.white
          : styles.gray,
    },
    children: [
      Flex({
        children: [
          Text(displayValue || '', focused ? styles.white : styles.gray),
          Text(cursor, { color: '#FF6600' }),
        ],
      }),
    ],
  })

  const labelContent = label ? [Text(label, styles.gray)] : []
  const errorContent = error ? [Text(error, { color: '#ff4444' })] : [Break()]

  return Stack([...labelContent, inputContent, ...errorContent])
})
