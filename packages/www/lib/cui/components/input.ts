import { Component } from '../component'
import { Box, Break, Flex, Stack, Text } from './'
import { styles } from '../render'
import type { Style } from '../style'
import { useModalHandlers } from '../keyboard'

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
  } = props

  if (focused) {
    useModalHandlers([
      {
        keys: ['Backspace'],
        handler: () => {
          const newValue = value.slice(0, -1)
          let newError: string | undefined

          if (validate) {
            const result = validate(newValue)
            if (!result.valid) {
              newError = result.message
            }
          }

          onChange?.(newValue, newError)
          return true // Stop propagation
        },
      },
      {
        handler: (event: KeyboardEvent) => {
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            const newValue = value + event.key
            let newError: string | undefined

            if (validate) {
              const result = validate(newValue)
              if (!result.valid) {
                newError = result.message
              }
            }

            onChange?.(newValue, newError)
            return true // Stop propagation
          }
          return false // Let event bubble
        },
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
