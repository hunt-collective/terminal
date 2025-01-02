/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'

export function remarkAsides(): ReturnType<Plugin<[], Root>> {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (!index || !parent) return

        type Variant = 'note' | 'tip' | 'caution' | 'danger'
        const variants = new Set(['note', 'tip', 'caution', 'danger'])
        const isAsideVariant = (s: string): s is Variant => variants.has(s)
        if (!isAsideVariant(node.name)) return

        const data = node.data || (node.data = {})
        const [title] = node.children
          .filter(
            (c) =>
              c.data && 'directiveLabel' in c.data && c.data?.directiveLabel,
          )
          .map((v) => toString(v))
        if (title) node.children.splice(0, 1)

        data.hName = 'aside'
        data.hProperties = {
          'data-type': node.name,
          'data-title': title,
        }

        // add data attributes to paragraph tags inside the directive
        if ('children' in node) {
          node.children.forEach((child) => {
            if (child.type === 'paragraph') {
              const childData = child.data || (child.data = {})
              childData.hProperties = {
                ...childData.hProperties,
                'data-inner': 'true',
              }
            }
          })
        }
      }
    })
  }
}
