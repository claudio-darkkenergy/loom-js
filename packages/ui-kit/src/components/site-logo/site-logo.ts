import styles from './styles.scss';
import { ContentfulImage, Figure, FigureProps } from '@loom-js/tags';
import classNames from 'classnames';

export interface SiteLogoProps extends Pick<FigureProps, 'caption'> {
    className?: string;
    height?: number | string;
    width?: number | string;
}

export const SiteLogo = ({ caption, className, ...imgProps }: SiteLogoProps) =>
    Figure({
        caption,
        children: ContentfulImage({
            ...imgProps,
            description: 'loomjs logo',
            url: '/assets/img/loom-logo-64.svg'
        }),
        className: classNames(styles.siteLogo, className)
    });
