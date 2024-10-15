import {
    ContentfulRichText,
    ContentfulRichTextProps
} from '../contentful-rich-text';
import styles from './StyledRichText.module.css';
import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import { type SimpleComponent } from '@loom-js/core';
import { PinkCodePanel } from '@loom-js/pink';
import { H1, H2, H3, H4 } from '@loom-js/tags';
import classNames from 'classnames';

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
                            // PinkCodePanel.Header({
                            //     children:
                            //         site.shortDescription
                            // }),
                            PinkCodePanel.Content({
                                children: String(children),
                                useLineNumbers: false
                            })
                        ]
                    })
            },
            renderNode: {
                [BLOCKS.HEADING_1]: (_, children) =>
                    H1({ children, className: 'heading-level-3 u-capitalize' }),
                [BLOCKS.HEADING_2]: (_, children) =>
                    H2({ children, className: 'heading-level-4 u-capitalize' }),
                [BLOCKS.HEADING_3]: (_, children) =>
                    H3({ children, className: 'heading-level-5' }),
                [BLOCKS.HEADING_4]: (_, children) =>
                    H4({ children, className: 'heading-level-6' })
            }
        }
    });
