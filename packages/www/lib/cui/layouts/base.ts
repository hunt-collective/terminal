import type { Component, ParentProps } from '../render'
import { Stack } from '../components'
import { Footer } from '../components/footer'
import { Header } from '../components/header'
import type { Model } from '../app'

interface Props extends ParentProps {
  model: Model
}

export function Layout({ children, model }: Props): Component {
  return Stack({
    gap: 1,
    children: [
      Header({ model }),
      Stack({ children, minHeight: model.dimensions.height }),
      Footer({ page: model.page }),
    ],
  })
}
