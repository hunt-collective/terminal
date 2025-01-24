import { Layout } from '../layouts/base'
import { Breadcrumbs } from '../components/breadcrumbs'
import type { PropsWithChildren } from 'react'

interface CheckoutLayoutProps extends PropsWithChildren {
  current: 'cart' | 'shipping' | 'payment' | 'confirm' | 'final'
}

export const CheckoutLayout = ({ children, current }: CheckoutLayoutProps) => {
  return (
    <Layout>
      <div className="gap-1">
        <Breadcrumbs
          current={current}
          steps={['cart', 'shipping', 'payment', 'confirmation']}
        />
        {children}
      </div>
    </Layout>
  )
}
