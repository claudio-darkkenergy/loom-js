// A detached document delegating everything else (constructors, `NodeFilter`)
// to the real window — the injected-DOM shape `renderToString` expects, so the
// browser can stand in for the server runtime in end-to-end specs (same
// provider-seam path linkedom takes). A Proxy, not prototype delegation:
// Window's accessor properties throw "Illegal invocation" on any other
// receiver, so reads go through the real window and bound functions come back
// callable. Constructors (capitalized) stay unbound so `instanceof` checks
// keep working.
export const createServerWindow = () => {
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
