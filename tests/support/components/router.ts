import { component, onRoute, router } from '../../../src';

import { TestComponentProps } from './container';

export interface RouterPropValue {
    defaultText: string;
    testRoute: string;
    testText: string;
}

export const Router = component<
    Omit<TestComponentProps, 'value'> & { value?: RouterPropValue }
>((html, { className, disabled, style, value }) => {
    const getRouteText = (text = '') => document.createTextNode(text);

    return html`
        <main class=${className} disabled=${disabled} style=${style}>
            <a $click=${onRoute} href="/">Default route</a>
            <a
                $click=${(event: Event) => onRoute(event, { onHash: () => {} })}
                href=${value?.testRoute}
            >
                Test route
            </a>
            <div>
                ${router(({ value: { hash, pathname } }) => {
                    if (!value?.testRoute) {
                        const msg =
                            'A test route was not provided - pass prop `value.testRoute`.';
                        console.warn(msg);

                        return getRouteText(msg);
                    }

                    switch (`${pathname}${hash}`) {
                        case value?.testRoute:
                            return getRouteText(value?.testText);
                        default:
                            return getRouteText(value?.defaultText);
                    }
                })}
            </div>
        </main>
    `;
});
