import { Stack } from '../components'
import { ParentComponent } from '../component'
import { Layout } from './base'
import { Breadcrumbs } from '../components/breadcrumbs'

interface CheckoutLayoutProps {
  current: 'cart' | 'shipping' | 'payment' | 'confirm' | 'final'
}

export const CheckoutLayout = ParentComponent<CheckoutLayoutProps>(
  ({ children, current }) => {
    return Layout(
      Stack({
        gap: 1,
        children: [
          Breadcrumbs({
            current,
            steps: ['cart', 'shipping', 'payment', 'confirmation'],
          }),
          ...children,
        ],
      }),
    )
  },
)
