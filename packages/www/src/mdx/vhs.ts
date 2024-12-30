/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
// import { Resource } from 'sst'
import LZString from 'lz-string'
import gopackage from '../../../go/package.json'

export function remarkVhs(): ReturnType<Plugin<[], Root>> {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (!index || !parent) return
        if (!node.name.startsWith('vhs')) return
        let [, format] = node.name.split('-')
        format = format || 'gif'

        const [alt] = node.children
          .filter(
            (c) =>
              c.data && 'directiveLabel' in c.data && c.data?.directiveLabel,
          )
          .map((v) => toString(v))

        const data = node.data || (node.data = {})
        const uncompressed = node.children
          .filter(
            (c) =>
              !c.data ||
              !('directiveLabel' in c.data) ||
              !c.data.directiveLabel,
          )
          .map((v) => toString(v))
          .join('\n')
          .replaceAll('“', '"')
          .replaceAll('”', '"')

        data.hName = 'img'
        data.hProperties = {
          src:
            // Resource.VhsCdn.url +
            'https://vhs2.dev.terminal.shop' +
            `/${format}/` +
            gopackage.version +
            '/' +
            LZString.compressToEncodedURIComponent(uncompressed),
          alt,
          width: 500,
        }
        data.hChildren = undefined
        node.children = []
      }
    })
  }
}
