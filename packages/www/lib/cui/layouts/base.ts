import { Stack } from '../components'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { ParentComponent } from '../component'
import { dimensions } from '../render'

export const Layout = ParentComponent(({ children }) => {
  return Stack({
    gap: 1,
    children: [
      Header(),
      Stack({ children, minHeight: dimensions.height }),
      Footer(),
    ],
  })
})
