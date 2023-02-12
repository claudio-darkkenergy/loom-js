import classNames from 'classnames';

import { ContentfulImage, Figure, FigureProps } from '@app/component/simple';

import styles from './styles.scss';

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
