'use strict';

import { visit } from 'unist-util-visit';
import { spawnSync as spawnSync } from 'child_process';
import * as prettier from 'prettier';

function visitor(node) {
  if (
    node.type == 'code' &&
    node.lang &&
    (!node.meta || !node.meta.includes('nolint')) &&
    node.value &&
    !node.value.includes('--8<--')
  ) {
    switch (node.lang) {
      case 'c++':
      case 'cpp':
      case 'c':
        {
          const child = spawnSync('clang-format', { input: node.value });
          if (child.stderr.toString()) {
            console.warn(
              '[remark-clang-format] stderr: ',
              child.stderr.toString(),
            );
          }
          if (!child.stdout) {
            console.warn('[remark-clang-format] empty stdout');
            console.warn('[remark-clang-format] original code: ', node.value);
            console.warn('[remark-clang-format] child info', child);
            // node value left untouched
          } else {
            node.value = child.stdout;
          }
        }
        break;

      case 'javascript':
      case 'typescript':
      case 'js':
      case 'ts':
        {
          const formatted = prettier
            .format(node.value, {
              parser: 'babel',
              endOfLine: 'auto',
              semi: true,
              singleQuote: true,
              trailingComma: 'all',
            })
            .trimEnd(); // Prettier inserts trailing line which we do not want
          node.value = formatted;
        }
        break;
    }
  }
}

export default function attacher() {
  return function transformer(tree) {
    visit(tree, visitor);
  };
}
