declare module '*.json';
declare module '*.css';
declare module '*.svg';

// CSS-only packages (their `main` is a stylesheet; no JS, no types) —
// declared so their side-effect imports compile under NodeNext.
declare module '@appwrite.io/pink';
declare module '@appwrite.io/pink-icons';

// DefinePlugin defined globals
// declare const __LOCAL_DEV__: Boolean;
declare let __API_URL__: string;
declare let __CTF_IS_PREVIEW__: boolean;
declare let __DEV__: boolean;
declare let __USE_MOCKS__: boolean;
