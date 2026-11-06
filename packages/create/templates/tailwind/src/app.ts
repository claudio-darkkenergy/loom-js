import { component, createRoutes, RouteLink } from '@loom-js/core';

// Pages load on demand. Registering routes touches no DOM, so module scope
// is safe on the server too.
const Routes = createRoutes({
    config: {
        '/': () => import('@app/pages/home'),
        '/about': () => import('@app/pages/about')
    }
});

/** The composed app: the browser entry and the server render both call it. */
export const App = component(
    (html, props) => html`
        <div class="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6">
            <nav class="flex gap-4 font-medium" id="app-nav">
                <${RouteLink} href="/">Home</>
                <${RouteLink} href="/about">About</>
            </nav>
            <main>${Routes(props)}</main>
        </div>
    `
);
