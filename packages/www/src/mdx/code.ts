/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'

interface CodeElement extends Root {
  tagName: string
  properties: {
    [key: string]: unknown
  }
}

export function remarkCode(): ReturnType<Plugin<[], Root>> {
  return (tree) => {
    visit(tree, 'element', (node: CodeElement) => {
      if (node.tagName === 'code') {
        console.log(node)
        node.properties['data-code'] = toString(node).replace(/\n/g, '\u007f')
      }
    })
  }
}
