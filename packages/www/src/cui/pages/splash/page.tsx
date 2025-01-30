import { useRouter } from '@textjs/core/router'
import { useCart, useProducts } from '../../hooks'
import React from 'react'
import { Logo } from '../../components/logo'

export default function SplashPage() {
  const router = useRouter()
  const [delayed, setDelayed] = React.useState(false)
  const { isSuccess: cart } = useCart()
  const { isSuccess: products } = useProducts()

  React.useEffect(() => {
    const interval = setTimeout(() => setDelayed(true), 3000)
    return () => clearTimeout(interval)
  }, [])

  React.useEffect(() => {
    if (!cart || !products || !delayed) return
    router.navigate('/shop')
  }, [cart, products, delayed])

  return (
    <div className="items-center justify-center size-full text-white">
      <Logo />
    </div>
  )
}
