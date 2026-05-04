import type {
    Component,
    ComponentContextPartial,
    ComponentProps
} from '../../types';
import { getContextRootAnchor } from '../context';
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
                console.log({
                    _children: Array.from(this.children),
                    _scope: this,
                    _props: this.props,
                    $props,
                    props
                });
                const ctxFn = componentFunction(props as ComponentProps<Props>);
                const ctx = ctxFn(this.ctx);

                if (shadowInit) {
                    const shadow = this.attachShadow(shadowInit);
                    mount(shadow as any, ctx, null);
                } else {
                    mount(this as any, ctx, null);
                }

                console.log('customElement', {
                    ctx,
                    root: ctx.root,
                    rootParent: getContextRootAnchor(ctx)?.parentElement,
                    rootChildNodes: getContextRootAnchor(ctx)?.childNodes
                });
            }
        }
    );
};
