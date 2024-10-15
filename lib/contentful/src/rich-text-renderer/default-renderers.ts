import { RenderMark, RenderNode } from './types';
import { BLOCKS, Inline, INLINES, MARKS } from '@contentful/rich-text-types';
import {
    Blockquote,
    Bold,
    Code,
    Div,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    Hr,
    Italic,
    Li,
    Link,
    Ol,
    Paragraph,
    Pre,
    Span,
    Table,
    Td,
    Th,
    Tr,
    Ul,
    Underline
} from '@loom-js/tags';

const defaultInline = (_type: string, node: Inline) =>
    Span({
        children: `type: ${node.nodeType} id: ${node.data.target.sys.id}`
    });

export const defaultNodeRenderers: RenderNode = {
    [BLOCKS.DOCUMENT]: (_node, children) => children,
    [BLOCKS.PARAGRAPH]: (_node, children) => Paragraph({ children }),
    [BLOCKS.HEADING_1]: (_node, children) => H1({ children }),
    [BLOCKS.HEADING_2]: (_node, children) => H2({ children }),
    [BLOCKS.HEADING_3]: (_node, children) => H3({ children }),
    [BLOCKS.HEADING_4]: (_node, children) => H4({ children }),
    [BLOCKS.HEADING_5]: (_node, children) => H5({ children }),
    [BLOCKS.HEADING_6]: (_node, children) => H6({ children }),
    [BLOCKS.EMBEDDED_ENTRY]: (_node, children) => Div({ children }),
    [BLOCKS.UL_LIST]: (_node, children) => Ul({ children }),
    [BLOCKS.OL_LIST]: (_node, children) => Ol({ children }),
    [BLOCKS.LIST_ITEM]: (_node, children) => Li({ children }),
    [BLOCKS.QUOTE]: (_node, children) => Blockquote({ children }),
    [BLOCKS.HR]: () => Hr(),
    [BLOCKS.TABLE]: (_node, children) => Table({ children }),
    [BLOCKS.TABLE_ROW]: (_node, children) => Tr({ children }),
    [BLOCKS.TABLE_HEADER_CELL]: (_node, children) => Th({ children }),
    [BLOCKS.TABLE_CELL]: (_node, children) => Td({ children }),
    [INLINES.ASSET_HYPERLINK]: (node) =>
        defaultInline(INLINES.ASSET_HYPERLINK, node as Inline),
    [INLINES.ENTRY_HYPERLINK]: (node) =>
        defaultInline(INLINES.ENTRY_HYPERLINK, node as Inline),
    [INLINES.EMBEDDED_ENTRY]: (node) =>
        defaultInline(INLINES.EMBEDDED_ENTRY, node as Inline),
    [INLINES.HYPERLINK]: (node, children) =>
        Link({ children, href: node.data.uri })
};

export const defaultMarkRenderers: RenderMark = {
    [MARKS.BOLD]: (children) => Bold({ children }),
    [MARKS.ITALIC]: (children) => Italic({ children }),
    [MARKS.UNDERLINE]: (children) => Underline({ children }),
    [MARKS.CODE]: (children) => Code({ children: Pre({ children }) })
};
