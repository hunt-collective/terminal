import { styles } from '../render'
import { Flex } from './flex'
import { Text } from './text'

type BreadcrumbsProps = {
  steps: string[]
  current: string
}

export function Breadcrumbs({ steps, current }: BreadcrumbsProps) {
  return Flex({
    gap: 1,
    children: steps.flatMap((step, index) => [
      Text(step, {
        style: step === current ? styles.white : styles.gray,
      }),
      index < steps.length - 1 ? Text('/', { style: styles.gray }) : '',
    ]),
  })
}
