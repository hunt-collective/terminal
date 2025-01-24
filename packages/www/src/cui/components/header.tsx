import { useCart } from '../hooks'
import { useRouter } from '@textjs/core/router'

export const Header = () => {
  const { data: cart } = useCart()
  const router = useRouter()

  return (
    <div className="p-1 bg-[#1e1e1e] border-b border-[#666]">
      <div className="flex justify-around">
        <span>terminal</span>
        <div className="flex gap-1">
          <span>s</span>
          <span
            style={{
              color: router?.route === 'shop' ? 'white' : 'gray',
            }}
          >
            shop
          </span>
        </div>
        <div className="flex gap-1">
          <span>a</span>
          <span
            className="line-through"
            style={{
              color: router?.route === 'account' ? 'white' : 'gray',
            }}
          >
            account
          </span>
        </div>
        <div className="flex gap-1">
          <span>c</span>
          <span
            style={{
              color: router?.route === 'cart' ? 'white' : 'gray',
            }}
          >
            cart
          </span>
          <span>{`$ ${(cart?.subtotal ?? 0) / 100}`}</span>
          <span className="text-gray">
            {`[${cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`}
          </span>
        </div>
      </div>
    </div>
  )
}
