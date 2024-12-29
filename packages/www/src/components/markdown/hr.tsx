import EmptyLine from './empty-line'
import { type Component, type ParentProps } from 'solid-js'

const HR: Component<ParentProps> = (props) => {
  return (
    <>
      <EmptyLine />
      <hr {...props} />
      <EmptyLine />
    </>
  )
}

export default HR
