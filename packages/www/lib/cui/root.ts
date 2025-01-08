import { Component } from './component'
import { RouterContext, createRouter } from './router'
import { ShopPage } from './pages/shop'
import { CartPage } from './pages/cart'
import { SplashPage } from './pages/splash'
import { ShippingPage } from './pages/shipping'
import { useEffect, useKeydown, useState } from './hooks'
import { ModelContext } from './app'

export const App = Component(() => {
  const [model] = ModelContext.useContext()

  const router = createRouter()
  RouterContext.Provider(router)

  useEffect(() => {
    async function init() {
      const client = await model.client()

      // Ensure splash shows for at least 3 seconds
      const splashPromise = new Promise((resolve) => setTimeout(resolve, 3000))
      const dataPromise = client.view.init().then((r) => r.data)

      // Wait for both data and minimum splash time
      const { profile, products, cart, addresses } = await Promise.all([
        dataPromise,
        splashPromise,
      ]).then(([data]) => data)

      // Switch to shop view with loaded data
      const newModel = {
        ...model,
        profile,
        cart,
        products,
        addresses,
      }

      ModelContext.Provider(newModel)

      router.navigate('shop')
    }

    init()
  })

  // Global keyboard shortcuts
  useKeydown('s', () => router.navigate('shop'))
  useKeydown('c', () => router.navigate('cart'))

  // useKeydown('escape', () => {
  //   switch (router.route) {
  //     case 'cart':
  //       router.navigate('shop')
  //       break
  //     case 'shipping':
  //       router.navigate('cart')
  //       break
  //   }
  // })

  const { route } = router
  switch (route) {
    case 'shop':
      return ShopPage()
    // case 'cart':
    //   return CartPage.view()
    case 'splash':
      return SplashPage()
    // case 'shipping':
    //   return ShippingPage.view()
    default:
      throw new Error(`${route} page not implemented`)
  }
})
