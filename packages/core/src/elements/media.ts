import { component } from '../component';
import { simple } from '../simple';

// The media components: Svg ports the tags sprite convention; Picture is a
// chooser over two internal template components (a component's template has
// one fixed root, so "<picture> when sources, bare <img> when not" cannot be
// a single template).

export interface SvgProps {
    height?: string;
    path?: string;
    size?: string;
    svgId?: string;
    width?: string;
}

export const Svg = /* @__PURE__ */ component<SvgProps>(
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

export interface SourceProps {
    media?: string;
    sizes?: string;
    srcset?: string;
    type?: string;
}

export interface PictureProps {
    alt?: string;
    height?: string;
    loading?: 'eager' | 'lazy';
    sources?: SourceProps[];
    src?: string;
    width?: string;
}

const Source = /* @__PURE__ */ component<SourceProps>(
    (html, { media, sizes, srcset, type }) => html`
        <source media=${media} sizes=${sizes} srcset=${srcset} type=${type} />
    `
);

const Img = /* @__PURE__ */ component<Omit<PictureProps, 'sources'>>(
    (html, { alt, attrs, className, height, loading, on, src, width }) => html`
        <img
            $attrs=${attrs}
            $on=${on}
            alt=${alt}
            class=${className}
            height=${height}
            loading=${loading}
            src=${src}
            width=${width}
        />
    `
);

const PictureEl = /* @__PURE__ */ component<PictureProps>(
    (
        html,
        { alt, attrs, className, height, loading, on, sources, src, width }
    ) => html`
        <picture $attrs=${attrs} $on=${on} class=${className}>
            ${sources?.map((sourceProps) => Source(sourceProps))}
            ${Img({ alt, height, loading, src, width })}
        </picture>
    `
);

export const Picture = /* @__PURE__ */ simple<PictureProps>(
    ({ sources, ...imgProps }) =>
        sources?.length ? PictureEl({ ...imgProps, sources }) : Img(imgProps)
);
