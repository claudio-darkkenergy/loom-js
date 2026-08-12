import { BLOCKS, Inline, INLINES, MARKS } from '@contentful/rich-text-types';
import { el } from '@loom-js/core';

import { RenderMark, RenderNode } from './types';

const defaultInline = (_type: string, node: Inline) =>
    el('span')({
        children: `type: ${node.nodeType} id: ${node.data.target.sys.id}`
    });

export const defaultNodeRenderers: RenderNode = {
    [BLOCKS.DOCUMENT]: (_node, children) => children,
    [BLOCKS.PARAGRAPH]: (_node, children) => el('p')({ children }),
    [BLOCKS.HEADING_1]: (_node, children) => el('h1')({ children }),
    [BLOCKS.HEADING_2]: (_node, children) => el('h2')({ children }),
    [BLOCKS.HEADING_3]: (_node, children) => el('h3')({ children }),
    [BLOCKS.HEADING_4]: (_node, children) => el('h4')({ children }),
    [BLOCKS.HEADING_5]: (_node, children) => el('h5')({ children }),
    [BLOCKS.HEADING_6]: (_node, children) => el('h6')({ children }),
    [BLOCKS.EMBEDDED_ENTRY]: (_node, children) => el('div')({ children }),
    [BLOCKS.UL_LIST]: (_node, children) => el('ul')({ children }),
    [BLOCKS.OL_LIST]: (_node, children) => el('ol')({ children }),
    [BLOCKS.LIST_ITEM]: (_node, children) => el('li')({ children }),
    [BLOCKS.QUOTE]: (_node, children) => el('blockquote')({ children }),
    [BLOCKS.HR]: () => el('hr')({}),
    [BLOCKS.TABLE]: (_node, children) => el('table')({ children }),
    [BLOCKS.TABLE_ROW]: (_node, children) => el('tr')({ children }),
    [BLOCKS.TABLE_HEADER_CELL]: (_node, children) => el('th')({ children }),
    [BLOCKS.TABLE_CELL]: (_node, children) => el('td')({ children }),
    [INLINES.ASSET_HYPERLINK]: (node) =>
        defaultInline(INLINES.ASSET_HYPERLINK, node as Inline),
    [INLINES.ENTRY_HYPERLINK]: (node) =>
        defaultInline(INLINES.ENTRY_HYPERLINK, node as Inline),
    [INLINES.EMBEDDED_ENTRY]: (node) =>
        defaultInline(INLINES.EMBEDDED_ENTRY, node as Inline),
    [INLINES.HYPERLINK]: (node, children) =>
        el('a')({
            children,
            // The retired tags Link always emitted target=_self.
            attrs: { href: node.data.uri, target: '_self' }
        })
};

export const defaultMarkRenderers: RenderMark = {
    [MARKS.BOLD]: (children) => el('b')({ children }),
    [MARKS.ITALIC]: (children) => el('i')({ children }),
    [MARKS.UNDERLINE]: (children) => el('u')({ children }),
    [MARKS.CODE]: (children) =>
        el('code')({ children: el('pre')({ children }) })
};
