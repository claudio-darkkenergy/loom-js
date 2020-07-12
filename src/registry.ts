import { Framework } from './framework';
import { NodeTemplateFunction } from './index.d';

let registered: null | Map<string, NodeTemplateFunction> = null;

export const Registry = () => {
    return registered || setRegistered();

    function setRegistered() {
        registered = Framework.Settings.registry
            ? new Map(Object.entries(Framework.Settings.registry))
            : new Map();

        return registered;
    }
};
