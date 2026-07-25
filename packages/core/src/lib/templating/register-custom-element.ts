import type {
    Component,
    ComponentContextPartial,
    ComponentInputProps
} from '../../types';
import { toCamelCase, toKebabCase } from '../helpers';
import { mount } from '../mount';

export const registerCustomElement = <Props extends object>({
    name,
    componentFunction,
    shadowInit = { mode: 'open' }
}: {
    name?: string;
    componentFunction: Component<Props>;
    shadowInit?: ShadowRootInit | false;
}) => {
    if (!name) {
        return;
    }

    const elementName = toKebabCase(name);

    window.customElements.define(
        elementName,
        class extends HTMLElement {
            ctx: ComponentContextPartial = {};
            isWebComponent = true;
            props = {};

            constructor() {
                super();
            }

            connectedCallback() {
                const $props = Object.values(this.attributes).reduce(
                    (acc, attr) =>
                        attr.nodeName[0] === '$'
                            ? {
                                  ...acc,
                                  [toCamelCase(attr.nodeName.slice(1))]:
                                      attr.nodeValue
                              }
                            : acc,
                    {}
                );
                const props = Object.assign(
                    {
                        children: this.childNodes.length
                            ? Array.from(this.childNodes)
                            : undefined
                    },
                    this.props,
                    $props
                );
                const ctxFn = componentFunction(
                    props as ComponentInputProps<Props>
                );
                const ctx = ctxFn(this.ctx);

                if (shadowInit) {
                    const shadow = this.attachShadow(shadowInit);
                    mount(shadow as any, ctx, null);
                } else {
                    mount(this as any, ctx, null);
                }
            }
        }
    );
};
