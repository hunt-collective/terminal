import { Component } from './component'
import { RouterContext, createRouter } from './router'
import { ShopPage } from './pages/shop'
import { CartPage } from './pages/cart'
import { SplashPage } from './pages/splash'
import { ShippingPage } from './pages/shipping'
import { useCart, useEffect, useKeydown, useProducts, useState } from './hooks'

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

  // Global keyboard shortcuts
  useKeydown('s', () => router.navigate('shop'))
  useKeydown('c', () => router.navigate('cart'))

  if (!delayed || !products || !cart) return SplashPage()

  const { route } = router
  switch (route) {
    case 'splash':
      return SplashPage()
    case 'shop':
      return ShopPage()
    case 'cart':
      return CartPage()
    case 'shipping':
      return ShippingPage()
    default:
      throw new Error(`${route} page not implemented`)
  }
})
