/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { h } from 'hastscript'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import { Resource } from 'sst'
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
        if (node.name !== 'vhs') return

        const data = node.data || (node.data = {})
        const uncompressed = node.children.map(toString).join('\n')

        data.hName = 'img'
        data.hProperties = {
          src:
            Resource.VhsCdn.url +
            '/generate/' +
            gopackage.version +
            '/' +
            LZString.compressToEncodedURIComponent(uncompressed),
        }
        data.hChildren = undefined
      }
    })
  }
}
