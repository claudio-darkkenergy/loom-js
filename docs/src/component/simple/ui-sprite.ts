import { component } from '@loomjs/core';

import { Svg, SvgProps } from '@app/component/simple/tags';

export enum UiSpriteId {
    ArrowDown = 'icon-arrow-down',
    ArrowRight = 'icon-arrow-right',
    ArrowUp = 'icon-arrow-up',
    ChevronLeft = 'icon-chevron-left',
    ChevronRight = 'icon-chevron-right',
    ChevronUp = 'icon-chevron-up',
    Facebook = 'icon-facebook',
    Instagram = 'icon-instagram',
    Linkedin = 'icon-linkedin',
    Loader = 'icon-loader',
    MenuOpen = 'icon-menu-open',
    Minus = 'icon-minus',
    Plus = 'icon-plus',
    Search = 'icon-search',
    // SiteLogo = 'loom-logo',
    Twitter = 'icon-twitter',
    X = 'icon-x',
    Youtube = 'icon-youtube'
}

export interface IconProps extends SvgProps {
    className?: string;
    svgId: UiSpriteId;
}

export const UiSprite = component<IconProps>(
    (html, { className, ...props }) => html`
        <i class="${className}">
            ${Svg({
                ...props,
                path: '/assets/svg/ui-sprite.svg'
            })}
        </i>
    `
);
