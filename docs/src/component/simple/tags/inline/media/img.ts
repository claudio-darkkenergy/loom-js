import { component } from '@loomjs/core';

export type ImgProps = {
    alt?: string;
    height?: number | string;
    src?: string;
    width?: number | string;
};

export const Img = component<ImgProps>(
    (html, { alt, className, height = 'auto', src, width = 'auto' }) =>
        html`
            <img
                $src=${src}
                alt=${alt}
                class=${className}
                height=${height}
                width=${width}
            />
        `
);
