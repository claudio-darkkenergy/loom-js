declare module '*.json';
declare module '*.css';
declare module '*.svg';

// DefinePlugin defined globals
// declare const __LOCAL_DEV__: Boolean;
declare let __API_URL__: string;
declare let __CTF_IS_PREVIEW__: boolean;
declare let __DEV__: boolean;

interface Window {
    // The build-generated route-assets manifest (route pattern -> CSS URLs),
    // inlined by the shell template and handed to `createRoutes`.
    __ROUTE_ASSETS__?: Record<string, string[]>;
}
