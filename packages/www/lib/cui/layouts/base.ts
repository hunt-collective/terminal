import type { Component, LayoutNode } from '../render'
import { Stack } from '../components'
import { Footer } from '../components/footer'
import { Header } from '../components/header'

export function Layout(children: LayoutNode): Component {
  return (model, parentContext) => {
    return Stack(
      [
        Header(),
        Stack([children], { minHeight: model.dimensions.height }),
        Footer(),
      ],
      {
        gap: 1,
      },
    )(model, parentContext)
  }
}
