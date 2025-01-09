import { Component } from './component'
import { RouterContext, createRouter } from './router'
import {
  KeyboardContext,
  initializeKeyboardManager,
  useGlobalKeyboardHandlers,
} from './keyboard'
import { ShopPage } from './pages/shop'
import { CartPage } from './pages/cart'
import { SplashPage } from './pages/splash'
import { ShippingPage } from './pages/shipping'
import { useCart, useEffect, useProducts, useState } from './hooks'

const keyboardManager = initializeKeyboardManager()
KeyboardContext.Provider(keyboardManager)

export const App = Component(() => {
  const [delayed, setDelayed] = useState(false)
  const { data: products } = useProducts()
  const { data: cart } = useCart()

  const router = createRouter()
  RouterContext.Provider(router)

  useEffect(() => {
    const interval = setTimeout(() => setDelayed(true), 3000)
    return () => clearTimeout(interval)
  })

  // Set route in keyboard manager
  keyboardManager.setCurrentRoute(router.route)

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

  if (!delayed || !products || !cart) return SplashPage()

  switch (router.route) {
    case 'splash':
      return SplashPage()
    case 'shop':
      return ShopPage()
    case 'cart':
      return CartPage()
    case 'shipping':
      return ShippingPage()
    default:
      throw new Error(`${router.route} page not implemented`)
  }
})
