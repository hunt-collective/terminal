import { type Component, type JSX } from 'solid-js'
import Editor from '@components/editor'

type ContentProps = {} & JSX.HTMLAttributes<HTMLElement>

const ContentComponent: Component<ContentProps> = (props) => {
  return <Editor>{props.children}</Editor>
}

export default ContentComponent
