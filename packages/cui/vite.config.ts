import { defineConfig } from "vite"

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext", //browsers can handle the latest ES features
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
    jsx: "transform",
    jsxImportSource: "@textjs/core",
    jsxInject: `import { jsx, Fragment } from '@textjs/core/jsx'`,
    jsxFactory: "jsx",
  },
})
