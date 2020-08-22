import { Framework } from './framework';
import { ComponentFunction } from './types';

let registered: null | Map<string, ComponentFunction> = null;

export const Registry = () => {
    return registered || setRegistered();

    function setRegistered() {
        registered = Framework.Settings.registry
            ? new Map(Object.entries(Framework.Settings.registry))
            : new Map();

        return registered;
    }
};
