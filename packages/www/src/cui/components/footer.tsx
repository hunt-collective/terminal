import { useRouter } from '@textjs/core/router'

export const Footer = () => {
  const router = useRouter()

  let parts: { hint: string; text: string }[] = []
  switch (router.route) {
    case '/shop':
      parts = [
        { hint: '↑/↓', text: 'products' },
        { hint: '+/-', text: 'qty' },
        { hint: 'c', text: 'cart' },
        { hint: 'q', text: 'quit' },
      ]
      break
    case '/cart':
      parts = [
        { hint: 'esc', text: 'back' },
        { hint: '↑/↓', text: 'items' },
        { hint: '+/-', text: 'qty' },
        { hint: 'c', text: 'checkout' },
      ]
      break
  }

  return (
    <div className="text-gray">
      <span className="mx-auto">free shipping on US orders over $40</span>
      <div className="flex gap-3 justify-center border-t border-gray mt-1 leading-[300%]">
        {parts.map((part) => (
          <div key={part.text} className="flex gap-1">
            <span className="text-white">{part.hint}</span>
            <span className="text-gray">{part.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
