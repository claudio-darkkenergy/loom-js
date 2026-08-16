// End-to-end hydration proof: `renderToString` a routed app with lazy page
// content against an injected document (the browser stands in for the server
// runtime — same provider-seam path linkedom takes), serve that markup into a
// root, then `hydrate` and assert the takeover is invisible: no intermediate
// fallback ever attaches, and the final DOM matches the server markup.
import { expect } from '@esm-bundle/chai';

import { component, createRoutes, hydrate } from '../../src';
import { renderToString } from '../../src/server';

const ROUTE_PATH = '/hydrate-e2e/about';

const HomePage = component(
    (html) => html`
        <article class="home">home page</article>
    `
);
const AboutPage = component(
    (html, { routeProps }) => html`
        <article class="about">about page at ${routeProps?.pathname}</article>
    `
);
const Routes = createRoutes({
    config: {
        '/': () => Promise.resolve({ default: HomePage }),
        [ROUTE_PATH]: () => Promise.resolve({ default: AboutPage })
    }
});
const App = component(
    (html, props) => html`
        <main>${Routes(props)}</main>
    `
);

// A detached document delegating everything else (constructors, `NodeFilter`)
// to the real window — the injected-DOM shape `renderToString` expects. A
// Proxy, not prototype delegation: Window's accessor properties throw
// "Illegal invocation" on any other receiver, so reads go through the real
// window and bound functions come back callable. Constructors (capitalized)
// stay unbound so `instanceof` checks keep working.
const createServerWindow = () => {
    const ownProps: Record<PropertyKey, unknown> = {
        document: document.implementation.createHTMLDocument('ssr')
    };

    return new Proxy(ownProps, {
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }

            const value = (window as Record<PropertyKey, any>)[prop];

            return typeof value === 'function' && !/^[A-Z]/.test(String(prop))
                ? value.bind(window)
                : value;
        },
        has: (target, prop) => prop in target || prop in window,
        set(target, prop, value) {
            target[prop] = value;

            return true;
        }
    });
};

describe('hydration end-to-end', () => {
    it('should take over served route markup with no intermediate fallback and a matching final DOM', async () => {
        const serverMarkup = await renderToString(App(), {
            url: `${window.location.origin}${ROUTE_PATH}`,
            window: createServerWindow()
        });

        expect(serverMarkup).to.contain(`about page at ${ROUTE_PATH}`);

        // "Serve" the markup: the client boots on a root already carrying it,
        // with the browser at the matching route.
        window.history.pushState({}, '', ROUTE_PATH);

        const root = document.createElement('div');

        root.innerHTML = serverMarkup;
        document.body.append(root);

        const mutationBatches: MutationRecord[][] = [];
        const rootObserver = new MutationObserver((records) =>
            mutationBatches.push(records)
        );

        rootObserver.observe(root, { childList: true, subtree: true });

        await hydrate({ app: App(), root });

        // The same render path produced both sides — the swapped-in DOM
        // serializes byte-identical to the served markup.
        expect(root.innerHTML).to.equal(serverMarkup);
        expect(root.querySelector('.about')?.textContent).to.contain(
            ROUTE_PATH
        );

        // The only childList mutation on the root is the single swap — the
        // route fallback never attached.
        const rootRecords = [
            ...mutationBatches.flat(),
            ...rootObserver.takeRecords()
        ].filter((record) => record.target === root);

        rootObserver.disconnect();
        expect(rootRecords.length).to.equal(1);
        root.remove();
    });
});
