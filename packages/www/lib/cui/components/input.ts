import { Component } from '../component'
import { Box, Break, Flex, Stack, Text } from './'
import { styles } from '../render'
import type { Style } from '../style'

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
  onChange?: (value: string) => void
}

export const Input = Component<InputProps>((props) => {
  const {
    value,
    focused = false,
    label,
    placeholder = '',
    error,
    // style,
  } = props

  // Show placeholder if no value and not focused
  const displayValue = value || (!focused ? placeholder : '')

  // Cursor styling - only show when focused
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

// Helper function to handle input events
export function handleInputEvent(
  event: KeyboardEvent,
  value: string,
  onChange?: (value: string) => void,
  validate?: (value: string) => ValidationResult,
): { value: string; error?: string } {
  let newValue = value
  let error: string | undefined

  // Handle character input
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    newValue = value + event.key
  }

  // Handle backspace
  else if (event.key === 'Backspace') {
    newValue = value.slice(0, -1)
  }

  // Run validation if provided
  // if (validate) {
  //   const result = validate(newValue)
  //   if (!result.valid) {
  //     error = result.message
  //   }
  // }

  // Call onChange handler if provided
  if (onChange && newValue !== value) {
    onChange(newValue)
  }

  return { value: newValue, error }
}
