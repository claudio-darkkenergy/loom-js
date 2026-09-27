import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { el, RouteLink, simple } from '@loom-js/core';
import { PinkCard, PinkInlineCode } from '@loom-js/pink';
import classNames from 'classnames';

import {
    ContentfulRichText,
    ContentfulRichTextProps
} from '../contentful-rich-text';
import styles from './StyledRichText.module.css';
import { asCodeBlock, CodeSample } from './lib/code';
import { AnchoredHeading, collectHeadingAnchors } from './lib/heading';
import { tableRenderers } from './lib/table';

export type StyledRichTextProps = ContentfulRichTextProps;

export const StyledRichText = simple<StyledRichTextProps>(
    ({ className, ...props }) => {
        // Same pass `TopicToc` reads, so ids and TOC hrefs agree.
        const anchors = collectHeadingAnchors(props.json);

        return ContentfulRichText({
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

                        // Internal links navigate client-side; external
                        // links leave the docs in a new tab.
                        return href.startsWith('/')
                            ? RouteLink({ children, href })
                            : el('a')({
                                  children,
                                  attrs: {
                                      href,
                                      rel: 'noopener noreferrer',
                                      target: '_blank'
                                  }
                              });
                    },
                    [BLOCKS.HEADING_1]: (_, children) =>
                        el('h1')({
                            children,
                            className: 'heading-level-3 u-capitalize'
                        }),
                    [BLOCKS.HEADING_2]: (node, children) =>
                        AnchoredHeading({
                            anchorClassName: styles.headingAnchor,
                            anchorId: anchors.idOf(node) ?? '',
                            children,
                            className: classNames(
                                'heading-level-4 u-capitalize',
                                styles.anchoredHeading
                            )
                        }),
                    // Anchored for the TOC; no copy-link (h2-only for now).
                    [BLOCKS.HEADING_3]: (node, children) =>
                        el('h3')({
                            children,
                            className: 'heading-level-5',
                            id: anchors.idOf(node)
                        }),
                    // h4 and deeper: no anchor, not in the TOC.
                    [BLOCKS.HEADING_4]: (_, children) =>
                        el('h4')({ children, className: 'heading-level-6' })
                }
            }
        });
    }
);
