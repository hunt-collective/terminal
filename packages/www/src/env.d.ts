/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="../../../node_modules/@textjs/core/src/types/virtual-modules.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
