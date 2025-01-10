import { App, Route } from "@/app"
import Terminal from "@terminaldotshop/sdk"
import { TerminalContext } from "@/terminal"
import { TextjsApp } from "@textjs/core"
import { dimensions } from "@/styles"

// Auto-initialize when script loads
;(async () => {
  TerminalContext.Provider(
    new Promise<Terminal>(async (resolve) => {
      const client = new Terminal({
        bearerToken: `<token goes here>`,
        baseURL: `<api url goes here>`,
      })
      resolve(client)
    }),
  )

  const app = new TextjsApp<Route>("shop", App, dimensions)
  app.start()
})()
