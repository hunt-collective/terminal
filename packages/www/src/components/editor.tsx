import {
  createContext,
  type Component,
  type JSX,
  type ParentProps,
  useContext,
  createSignal,
  splitProps,
} from 'solid-js'

type EditorProps = { numberless?: boolean } & ParentProps &
  JSX.HTMLAttributes<HTMLDivElement>

const LineNumberContext = createContext<() => number | undefined>()
export function getLineNumber() {
  return useContext(LineNumberContext)?.()
}

const EditorComponent: Component<EditorProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'classList'])
  const [getLineNumber, setLatestLineNumber] = createSignal(1)

  function getNextLineNumber() {
    if (props.numberless) return undefined
    const latest = getLineNumber()
    setLatestLineNumber(latest + 1)
    return latest
  }

  return (
    <LineNumberContext.Provider value={getNextLineNumber}>
      <div
        {...others}
        classList={{
          ...local.classList,
          'leading-10': true,
          [local.class ?? '']: !!local.class,
        }}
      >
        {props.children}
      </div>
    </LineNumberContext.Provider>
  )
}

export default EditorComponent
