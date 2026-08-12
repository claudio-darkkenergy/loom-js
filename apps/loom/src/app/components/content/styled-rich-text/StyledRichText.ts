import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import { el, type SimpleComponent } from '@loom-js/core';
import { PinkCodePanel } from '@loom-js/pink';
import { toKebabCase } from '@loom-js/utils';
import classNames from 'classnames';

import {
    ContentfulRichText,
    ContentfulRichTextProps
} from '../contentful-rich-text';
import styles from './StyledRichText.module.css';

export type StyledRichTextProps = ContentfulRichTextProps;

export const StyledRichText: SimpleComponent<StyledRichTextProps> = ({
    className,
    ...props
}) =>
    ContentfulRichText({
        ...props,
        className: classNames(styles.richText, className),
        options: {
            renderMark: {
                [MARKS.CODE]: (children) =>
                    typeof children === 'string' &&
                    PinkCodePanel({
                        children: [
                            PinkCodePanel.Content({
                                children: String(children),
                                useLineNumbers: false
                            })
                        ]
                    })
            },
            renderNode: {
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
    });
