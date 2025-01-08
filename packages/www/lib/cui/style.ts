type Style = {
  // Background properties
  background?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  backgroundSize?: string

  // Border properties
  border?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  borderColor?: string
  borderStyle?: string
  borderWidth?: string

  // Border radius
  borderRadius?: string

  // Box properties
  boxDecorationBreak?: 'slice' | 'clone'
  boxShadow?: string

  // Float and clear
  clear?: 'none' | 'left' | 'right' | 'both'
  float?: 'none' | 'left' | 'right'

  // Basic properties
  color?: string
  cursor?: string
  display?:
    | 'block'
    | 'inline'
    | 'inline-block'
    | 'flex'
    | 'grid'
    | 'none'
    | 'contents'
    | 'flow-root'
    | 'table'
    | 'table-row'
    | 'table-cell'

  // Font properties
  font?: string
  fontFamily?: string
  fontSize?: string
  fontStyle?: string
  fontWeight?: string | number

  // Text properties
  lineHeight?: string | number
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  outline?: string
  outlineColor?: string
  outlineStyle?: string
  outlineWidth?: string
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string

  textAlign?: 'left' | 'right' | 'center' | 'justify'
  textDecoration?: string
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'
  textOverflow?: string

  // Spacing properties
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  wordSpacing?: string
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word'

  // Writing mode
  writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr'
}

const styleKeys: Record<keyof Style, true> = {
  background: true,
  backgroundColor: true,
  backgroundImage: true,
  backgroundPosition: true,
  backgroundRepeat: true,
  backgroundSize: true,
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  borderColor: true,
  borderStyle: true,
  borderWidth: true,
  borderRadius: true,
  boxDecorationBreak: true,
  boxShadow: true,
  clear: true,
  float: true,
  color: true,
  cursor: true,
  display: true,
  font: true,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontWeight: true,
  lineHeight: true,
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  outline: true,
  outlineColor: true,
  outlineStyle: true,
  outlineWidth: true,
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  textAlign: true,
  textDecoration: true,
  textTransform: true,
  textOverflow: true,
  whiteSpace: true,
  wordSpacing: true,
  wordBreak: true,
  writingMode: true,
}

const isValidStyleProperty = (property: string, value: any): boolean => {
  const isValidColor = (value: string): boolean => {
    // Basic color validation - checks hex, rgb, rgba, hsl, hsla, and named colors
    const colorRegex = /^(#[0-9A-Fa-f]{3,8}|(rgb|hsl)a?\(.*\)|[a-zA-Z]+)$/
    return typeof value === 'string' && colorRegex.test(value)
  }

  switch (property) {
    case 'color':
    case 'backgroundColor':
    case 'borderColor':
    case 'outlineColor':
      return isValidColor(value)

    case 'margin':
    case 'padding':
    case 'borderWidth':
    case 'outlineWidth':
    case 'fontSize':
    case 'lineHeight':
    case 'wordSpacing':
      return typeof value === 'string'

    case 'fontWeight':
      return (
        (typeof value === 'number' && value >= 100 && value <= 900) ||
        (typeof value === 'string' &&
          ['normal', 'bold', 'lighter', 'bolder'].includes(value))
      )

    case 'display':
      return (
        typeof value === 'string' &&
        [
          'block',
          'inline',
          'inline-block',
          'flex',
          'grid',
          'none',
          'contents',
          'flow-root',
          'table',
          'table-row',
          'table-cell',
        ].includes(value)
      )

    default:
      return typeof value === 'string'
  }
}

const isStyleObject = (obj: unknown): obj is Style => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  return Object.entries(obj).every(([key, value]) => {
    // Check if the property is defined in CSSProperties type
    if (!(key in styleKeys)) {
      return false
    }

    // Validate the property value
    return isValidStyleProperty(key, value)
  })
}

const styleObjectToString = (style: Style): string => {
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}

export type { Style }
export { isStyleObject, styleObjectToString }
