import Editor from './editor'
import Line from './line'
import { splitProps, type Component, type JSX } from 'solid-js'

type NavPage = { href: string; text: string; active: boolean }
type NavLink = { group: string; pages: NavPage[] }
type DocsNavProps = { links: NavLink[] } & JSX.HTMLAttributes<HTMLElement>

const DocsNavComponent: Component<DocsNavProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'classList', 'links'])
  return (
    <nav
      {...others}
      classList={{
        ...local.classList,
        'flex flex-col gap-y-0': true,
        [local.class ?? '']: true,
      }}
    >
      <Editor class="lowercase" numberless>
        <Line inactive class="h-10" />
        {local.links.map(({ group, pages }) => (
          <>
            <Line inactive class="text-white">
              {group}
            </Line>
            <>
              {pages.map(({ href, text, active }) => (
                <Line
                  internalLink
                  href={href}
                  state={active ? 'active' : 'normal'}
                >
                  {text}
                </Line>
              ))}
            </>
          </>
        ))}
      </Editor>
      <Line inactive class="h-10" />
    </nav>
  )
}

export default DocsNavComponent
