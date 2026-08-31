// `@types/prismjs` types the package root only; the core entry and the
// side-effect grammar modules need their own declarations.
declare module 'prismjs/components/prism-core' {
    import Prism from 'prismjs';

    export = Prism;
}

declare module 'prismjs/components/prism-clike';
declare module 'prismjs/components/prism-javascript';
declare module 'prismjs/components/prism-typescript';
declare module 'prismjs/components/prism-bash';
declare module 'prismjs/components/prism-markup';
