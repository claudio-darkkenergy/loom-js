import type {
    Component,
    ComponentContextPartial,
    ComponentInputProps,
    DefineElementOptions
} from '../../types';
import { toCamelCase } from '../helpers';
import { mount } from '../mount';

// Names the HTML spec reserves — each contains a hyphen but may not be used
// for a custom element.
const RESERVED_ELEMENT_NAMES = [
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph'
];
// A valid custom element name starts with a lowercase ASCII letter, contains a
// hyphen, and carries no uppercase characters.
const VALID_ELEMENT_NAME = /^[a-z][a-z0-9._]*-[a-z0-9._-]*$/;

/**
 * Fails eagerly on a name the browser would reject, and on a name already taken.
 * `customElements.define` throws for both, but its message identifies neither
 * the offending name nor the fact that something else registered it first.
 */
const assertRegisterable = (name: string) => {
    if (
        !VALID_ELEMENT_NAME.test(name) ||
        RESERVED_ELEMENT_NAMES.includes(name)
    ) {
        throw new Error(
            `[loom] "${name}" is not a valid custom element name. It must start with a lowercase letter, contain a hyphen, and use no uppercase characters — e.g. "pink-button".`
        );
    }

    if (window.customElements.get(name)) {
        throw new Error(
            `[loom] A custom element named "${name}" is already defined. Element names are global and cannot be redefined — pick a different name, or ensure the defining module is evaluated only once.`
        );
    }
};

export const registerCustomElement = <Props extends object>({
    componentFunction,
    name,
    shadow = false,
    styles
}: {
    componentFunction: Component<Props>;
    name: string;
} & DefineElementOptions) => {
    assertRegisterable(name);

    window.customElements.define(
        name,
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

                if (shadow) {
                    // `attachShadow` throws when a root already exists, which is
                    // the case whenever an element is disconnected & reconnected.
                    const shadowRoot =
                        this.shadowRoot || this.attachShadow(shadow);

                    if (styles?.length) {
                        shadowRoot.adoptedStyleSheets = styles;
                    }

                    mount(shadowRoot as unknown as Element, ctx, null);
                } else {
                    mount(this, ctx, null);
                }
            }
        }
    );
};
