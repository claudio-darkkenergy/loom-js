import classNames from 'classnames';

import {
    ContentfulRichText,
    ContentfulRichTextProps
} from '@loom-js/components/simple';

export type { ContentfulDocument } from '@app/helpers/contentful/rich-text-renderer/types';

import styles from './styles.scss';

export interface StyledRichTextProps extends ContentfulRichTextProps {
    className?: string;
}

export const StyledRichText = ({
    className,
    ...richTextProps
}: StyledRichTextProps) =>
    ContentfulRichText({
        ...richTextProps,
        className: classNames(styles.richText, className)
    });
