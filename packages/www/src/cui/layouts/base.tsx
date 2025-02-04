import { Header, Footer } from '../components'
import { type PropsWithChildren } from 'react'

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="gap-1 size-full">
      <Header />
      <div className="grow">{children}</div>
      <Footer />
    </div>
  )
}
