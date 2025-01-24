import { useRouter } from '@textjs/core/router'
import React from 'react'
import { callback, init, login } from '../auth'
import { Logo } from '../components/logo'
import cn from 'classnames'
import { Button } from '../components/button'

let pending = false

export const HomePage = () => {
  const router = useRouter()
  const [initialized, setInitialized] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  React.useEffect(() => {
    async function auth() {
      const hash = new URLSearchParams(location.search.slice(1))
      const code = hash.get('code')
      const state = hash.get('state')
      if (code && state) await callback(code, state)

      const token = await init()
      setInitialized(true)
      setSignedIn(!!token)
      if (token) router.navigate('splash')
    }

    if (pending) return
    pending = true
    auth()
  }, [])

  return (
    <div className="items-center justify-center size-full gap-3">
      <div
        key={Math.random()}
        className={cn({
          'h-3': true,
          hidden: !initialized || signedIn,
        })}
      />
      <Logo />
      <div
        key={Math.random()}
        className={cn({
          'items-center justify-center gap-1': true,
          hidden: !initialized || signedIn,
        })}
      >
        <span className="text-gray">sign in to the console.log shop</span>
        <Button key="enter" onClick={login}>
          sign in
        </Button>
      </div>
    </div>
  )
}
