import { Glob, $ } from "bun"

await $`rm -rf dist`
// const files = new Glob("./src/**/*.{ts,tsx}").scan()
// for await (const file of files) {
//   await Bun.build({
//     format: "esm",
//     outdir: "dist/esm",
//     external: ["*"],
//     root: "src",
//     entrypoints: [file],
//   })
// }
await $`tsc --outDir dist --declaration --declarationMap`
await $`cp ./src/types.d.ts dist/types.d.ts`
