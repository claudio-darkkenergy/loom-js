import { debugIsOn } from '../../config';

const noop = () => {};

// Methods resolve to natives bound to the console (never wrapper closures) so
// the browser attributes each message to the framework call site. The gate is
// read at property-access time — call sites access `loomConsole.<method>`
// per call and must not cache the resolved method.
export const loomConsole = new Proxy(globalThis.console, {
    get(target, prop) {
        const value = Reflect.get(target, prop);

        if (!(value instanceof Function)) {
            return value;
        }

        // Warnings and errors always surface — independent of the debug
        // configuration and of NODE_ENV.
        if (prop === 'warn' || prop === 'error') {
            return value.bind(target);
        }

        return debugIsOn() ? value.bind(target) : noop;
    }
});
