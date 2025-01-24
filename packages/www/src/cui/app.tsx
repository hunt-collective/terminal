import { SplashPage } from './pages/splash'
import { ShopPage } from './pages/shop'
import { TerminalContext } from './terminal'
import { useGlobalKeyboardHandlers } from '@textjs/core/keyboard'
import { createRouter, RouterContext } from '@textjs/core/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Terminal from '@terminaldotshop/sdk'
import { CartPage } from './pages/cart'
import { getToken } from './auth'
import { HomePage } from './pages'

const queryClient = new QueryClient()

export type Route =
  | 'home'
  | 'splash'
  | 'shop'
  | 'cart'
  | 'account'
  | 'shipping'
  | 'payment'
  | 'confirm'
  | 'final'

const baseURL = document
  .querySelector('meta[property="api-url"]')!
  .getAttribute('content')!

const terminal = async () => {
  const bearerToken = await getToken()
  if (!bearerToken) return
  return new Terminal({ bearerToken, baseURL })
}

export const App = () => {
  const router = createRouter<Route>('home')

  useGlobalKeyboardHandlers([
    {
      keys: ['s'],
      handler: () => {
        router.navigate('shop')
      },
    },
    {
      keys: ['c'],
      handler: () => {
        router.navigate('cart')
      },
    },
  ])

  const content = () => {
    switch (router.route) {
      case 'home':
        return <HomePage />
      case 'splash':
        return <SplashPage />
      case 'shop':
        return <ShopPage />
      case 'cart':
        return <CartPage />
      default:
        return <span>Invalid route: {router.route}</span>
    }
  }

  return (
    <RouterContext.Provider value={router}>
      <QueryClientProvider client={queryClient}>
        <TerminalContext.Provider value={terminal}>
          <div className="w-75 h-30 leading-tight font-mono">{content()}</div>
        </TerminalContext.Provider>
      </QueryClientProvider>
    </RouterContext.Provider>
  )
}
