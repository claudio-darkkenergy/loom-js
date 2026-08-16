// A route-table app registered at module scope — the real `apps/loom` shape.
// Importing this file in a runtime with no `window` is itself an assertion:
// `createRoutes` must be DOM-free at call time (it used to construct the
// router, which read `location`, and threw at import).
import { component, createRoutes } from '../../../dist/index.mjs';

export const AboutPage = component(
    (html, { routeProps }) => html`
        <article>about page at ${routeProps?.pathname}</article>
    `
);

export const HomePage = component(
    (html) => html`
        <article>home page</article>
    `
);

export const Routes = createRoutes({
    config: {
        '/': () => Promise.resolve({ default: HomePage }),
        '/about': () => Promise.resolve({ default: AboutPage })
    }
});

export const App = component(
    (html, props) => html`
        <main>${Routes(props)}</main>
    `
);
