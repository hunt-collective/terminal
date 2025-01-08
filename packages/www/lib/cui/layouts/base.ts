import { Stack } from '../components'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import { ModelContext } from '../app'
import { ParentComponent } from '../component'

export const Layout = ParentComponent(({ children }) => {
  const [model] = ModelContext.useContext()

  return Stack({
    gap: 1,
    children: [
      Header(),
      Stack({ children, minHeight: model.dimensions.height }),
      Footer(),
    ],
  })
})
