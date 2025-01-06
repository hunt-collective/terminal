import { Stack } from '../components'
import type { Model } from '../app'
import { ParentComponent } from '../component'
import { Layout } from './base'
import { Breadcrumbs } from '../components/breadcrumbs'

interface CheckoutLayoutProps {
  model: Model
  current: 'cart' | 'shipping' | 'payment' | 'confirm' | 'final'
}

export const CheckoutLayout = ParentComponent<CheckoutLayoutProps>(
  ({ children, model, current }) => {
    return Layout({
      model,
      children: Stack({
        gap: 1,
        children: [
          Breadcrumbs({
            current,
            steps: ['cart', 'shipping', 'payment', 'confirmation'],
          }),
          ...children,
        ],
      }),
    })
  },
)
