import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { el, RouteLink, simple } from '@loom-js/core';
import { PinkCard, PinkInlineCode } from '@loom-js/pink';
import { toKebabCase } from '@loom-js/utils';
import classNames from 'classnames';

import {
    ContentfulRichText,
    ContentfulRichTextProps
} from '../contentful-rich-text';
import styles from './StyledRichText.module.css';
import { asCodeBlock, CodeSample } from './lib/code';
import { tableRenderers } from './lib/table';

export type StyledRichTextProps = ContentfulRichTextProps;

export const StyledRichText = simple<StyledRichTextProps>(
    ({ className, ...props }) =>
        ContentfulRichText({
            ...props,
            className: classNames(styles.richText, className),
            options: {
                renderMark: {
                    // Code in a mixed-content paragraph renders inline; a
                    // sole-code paragraph becomes a code panel via the
                    // paragraph renderer below.
                    [MARKS.CODE]: (children) => PinkInlineCode({ children })
                },
                renderNode: {
                    ...tableRenderers,
                    [BLOCKS.PARAGRAPH]: (node, children) => {
                        const codeBlock = asCodeBlock(node);

                        return codeBlock
                            ? CodeSample(codeBlock)
                            : el('p')({ children });
                    },
                    // The callout treatment — blockquote-rooted card per the
                    // component inventory (`PinkAlert` port deferred).
                    [BLOCKS.QUOTE]: (_node, children) =>
                        PinkCard({ is: el('blockquote'), children }),
                    [INLINES.HYPERLINK]: (node, children) => {
                        const href = String(node.data.uri ?? '');

                        // Internal links navigate client-side.
                        return href.startsWith('/')
                            ? RouteLink({ children, href })
                            : el('a')({
                                  children,
                                  attrs: { href, target: '_self' }
                              });
                    },
                    [BLOCKS.HEADING_1]: (_, children) =>
                        el('h1')({
                            children,
                            className: 'heading-level-3 u-capitalize'
                        }),
                    [BLOCKS.HEADING_2]: (_, children) =>
                        el('h2')({
                            children,
                            className: 'heading-level-4 u-capitalize',
                            id:
                                typeof String(children) === 'string'
                                    ? toKebabCase(String(children))
                                    : undefined
                        }),
                    [BLOCKS.HEADING_3]: (_, children) =>
                        el('h3')({ children, className: 'heading-level-5' }),
                    [BLOCKS.HEADING_4]: (_, children) =>
                        el('h4')({ children, className: 'heading-level-6' })
                }
            }
        })
);
