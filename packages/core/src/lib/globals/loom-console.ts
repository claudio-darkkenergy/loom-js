import { canDebug } from '../../config';
import { Es6Object } from '../../types';

export const loomConsole = new Proxy(globalThis.console, {
    get(target, prop, receiver) {
        const value = (target as unknown as Es6Object)[prop];

        if (value instanceof Function) {
            return function (this: Console, ...args: unknown[]) {
                if (canDebug('console')) {
                    return value.apply(this === receiver ? target : this, args);
                }
            };
        }

        return value;
    }
});
