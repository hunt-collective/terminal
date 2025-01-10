import { Component } from "@textjs/core"
import { useGlobalKeyboardHandlers } from "@textjs/core/keyboard"
import { ShopPage } from "./pages/shop"
import { CartPage } from "./pages/cart"
import { SplashPage } from "./pages/splash"
import { ShippingPage } from "./pages/shipping"
import { useCart, useProducts } from "./hooks"
import { useState, useEffect } from "@textjs/core"
import { useRouter } from "@textjs/core/router"

export type Route =
  | "shop"
  | "cart"
  | "account"
  | "splash"
  | "shipping"
  | "payment"
  | "confirm"
  | "final"

export const App = Component(() => {
  const router = useRouter()
  const [delayed, setDelayed] = useState(false)
  const { data: products } = useProducts()
  const { data: cart } = useCart()

  useEffect(() => {
    const interval = setTimeout(() => setDelayed(true), 3000)
    return () => clearTimeout(interval)
  })

  useGlobalKeyboardHandlers([
    {
      keys: ["s"],
      handler: () => {
        router.navigate("shop")
      },
    },
    {
      keys: ["c"],
      handler: () => {
        router.navigate("cart")
      },
    },
  ])

  if (!delayed || !products || !cart) return <SplashPage />

  switch (router.route) {
    case "splash":
      return <SplashPage />
    case "shop":
      return <ShopPage />
    case "cart":
      return <CartPage />
    case "shipping":
      return <ShippingPage />
    default:
      throw new Error(`${router.route} page not implemented`)
  }
})
