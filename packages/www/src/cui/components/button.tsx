import { type PropsWithChildren } from 'react'
import cn from 'classnames'
import { useModalHandlers } from '@textjs/core/keyboard'

export interface ButtonProps extends PropsWithChildren {
  className?: string
  color?: string
  keys?: string[]
  hint?: boolean
  onClick?: () => void
}

export const Button = (props: ButtonProps) => {
  const keys = props.keys ?? ['enter']
  const color = props.color ?? '#FF5C00'
  const hint = props.hint ?? true

  useModalHandlers([
    {
      keys,
      handler: () => {
        if (props.onClick) {
          props.onClick()
          return true
        }
      },
    },
  ])

  return (
    <div className="flex gap-1">
      <div
        className={cn({
          'text-white px-1': true,
          [props.className ?? '']: !!props.className,
        })}
        style={{ backgroundColor: color }}
      >
        <span>{props.children}</span>
      </div>
      {hint && <span>{keys.join('/')}</span>}
    </div>
  )
}
