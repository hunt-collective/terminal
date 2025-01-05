import { Stack } from '../components'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import type { Model } from '../app'
import { ParentComponent } from '../component'

interface LayoutProps {
  model: Model
}

export const Layout = ParentComponent<LayoutProps>(({ children, model }) => {
  return Stack({
    gap: 1,
    children: [
      Header({ model }),
      Stack({ children, minHeight: model.dimensions.height }),
      Footer({ page: model.page }),
    ],
  })
})
