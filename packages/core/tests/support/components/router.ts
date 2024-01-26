import { component, onRoute, router } from '../../../src';

import { TestComponentProps } from './container';

export interface RouterPropValue {
    defaultRoute: string;
    defaultText: string;
    pushRouteClassname: string;
    replaceRoute: string;
    replaceRouteClassname: string;
    replaceText: string;
    testRoute: string;
    testText: string;
}

export const Router = component<
    Omit<TestComponentProps, 'value'> & { value?: RouterPropValue }
>((html, { className, disabled, style, value }) => {
    const getRouteText = (text = '') => document.createTextNode(text);

    return html`
        <main class=${className} disabled=${disabled} style=${style}>
            <a $click=${onRoute} href=${value?.defaultRoute}>Default route</a>
            <a
                $click=${onRoute}
                class=${value?.pushRouteClassname}
                href=${value?.testRoute}
            >
                Test route
            </a>
            <a
                $click=${(event: Event) => onRoute(event, { replace: true })}
                class=${value?.replaceRouteClassname}
                href=${value?.replaceRoute}
            >
                Replace route
            </a>
            <div>
                ${router(({ value: { hash, pathname } }) => {
                    if (!value?.testRoute || !value?.replaceRoute) {
                        const msg =
                            'A test route was not provided - pass prop `value.testRoute`.';
                        console.warn(msg);
                        return getRouteText(msg);
                    }

                    switch (`${pathname}${hash}`) {
                        case value?.testRoute:
                            return getRouteText(value?.testText);
                        case value?.replaceRoute:
                            return getRouteText(value?.replaceText);
                        default:
                            return getRouteText(value?.defaultText);
                    }
                })}
            </div>
        </main>
    `;
});
