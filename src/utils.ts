import Framework from '@framework';
import { PlainObject } from '@framework/index.d';

export class Debug {
    static close({ details }: PlainObject) {
        if (!!Framework.Settings.debug) {
            details.forEach((args: any[]) => console.log(...args));
            console.groupEnd();
        }
    }

    static open({ details, title }: PlainObject) {
        if (!!Framework.Settings.debug) {
            console.groupCollapsed(`=> ${title}`);
            details.forEach((args: any[]) => console.log(...args));
        }
    }
}

export const templateDebug = (..._args: any[]) => {
    debugger;
};
