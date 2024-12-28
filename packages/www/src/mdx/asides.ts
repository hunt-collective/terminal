/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { h } from 'hastscript'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export function remarkAsides(): ReturnType<Plugin<[], Root>> {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (!index || !parent) return
        if (node.name !== 'note') return

        const data = node.data || (node.data = {})
        const name = node.type === 'textDirective' ? 'span' : 'div'

        // parent.children[index] = h(tagName, { class: 'note' }, node.children)

        data.hName = name
        data.hProperties = { class: node.name }
      }
    })
  }
}
