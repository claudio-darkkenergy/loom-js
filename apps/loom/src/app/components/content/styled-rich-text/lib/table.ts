import {
    type Block,
    BLOCKS,
    type Inline,
    type Text as RichText
} from '@contentful/rich-text-types';
import type { Options } from '@loom-js/contentful';
import type { TemplateTagValue } from '@loom-js/core';
import { PinkTable } from '@loom-js/pink';

type RichTextNode = Block | Inline | RichText;

// Contentful's rich-text tables carry no row groups — rows sit directly
// under the table node, header rows distinguished only by their cells' type.
const isHeaderRow = (rowNode: RichTextNode): boolean =>
    rowNode.nodeType === BLOCKS.TABLE_ROW &&
    rowNode.content.every(
        (cellNode) => cellNode.nodeType === BLOCKS.TABLE_HEADER_CELL
    );

export const tableRenderers: NonNullable<Options['renderNode']> = {
    [BLOCKS.TABLE]: (node, children) => {
        const renderedRows: TemplateTagValue[] = Array.isArray(children)
            ? children
            : [children];
        const rowNodes = node.content;
        const headRows = renderedRows.filter((_, rowIndex) => {
            const rowNode = rowNodes[rowIndex];
            return rowNode !== undefined && isHeaderRow(rowNode);
        });
        const bodyRows = renderedRows.filter((_, rowIndex) => {
            const rowNode = rowNodes[rowIndex];
            return rowNode === undefined || !isHeaderRow(rowNode);
        });

        return PinkTable.Wrapper({
            children: PinkTable({
                children: [
                    ...(headRows.length
                        ? [PinkTable.Head({ children: headRows })]
                        : []),
                    PinkTable.Body({ children: bodyRows })
                ]
            })
        });
    },
    [BLOCKS.TABLE_ROW]: (_node, children) => PinkTable.Row({ children }),
    [BLOCKS.TABLE_HEADER_CELL]: (_node, children) =>
        PinkTable.HeadCol({ children }),
    [BLOCKS.TABLE_CELL]: (_node, children) => PinkTable.Col({ children })
};
