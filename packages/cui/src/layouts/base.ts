import { ParentComponent } from "@textjs/core"
import { Header, Footer } from "@/components"
import { Stack } from "@textjs/core/components"
import { dimensions } from "@/styles"

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
