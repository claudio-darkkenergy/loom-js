import { component } from '@loom-js/core';

export interface SvgProps {
    height?: string;
    path?: string;
    size?: string;
    svgId?: string;
    width?: string;
}

export const Svg = component<SvgProps>(
    (
        html,
        {
            className,
            height = '1em',
            path = '',
            size,
            svgId = '',
            width = '1em'
        }
    ) => html`
        <svg
            $height=${size || height}
            $width=${size || width}
            class=${className}
            fill="currentColor"
        >
            <use
                height="100%"
                href=${`${path}${svgId && `#${svgId}`}`}
                width="100%"
            ></use>
        </svg>
    `
);
