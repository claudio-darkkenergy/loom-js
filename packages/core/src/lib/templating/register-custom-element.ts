import type {
    Component,
    ComponentContextPartial,
    ComponentInputProps,
    ContextFunction,
    DefineElementOptions
} from '../../types';
import { DomWindow, getWindow, hasWindow } from '../dom';
import { toCamelCase } from '../helpers';
import { mount } from '../mount';

interface ElementRegistration extends DefineElementOptions {
    // Type-erased — registrations for differently-typed components live in
    // one list, and the element's attributes are stringly-typed anyway.
    componentFunction: (props: any) => ContextFunction;
    name: string;
}

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

// Every registration ever made, in order. Apps register elements at module
// scope — on a server that happens before any window exists, and each injected
// window carries its own `customElements` registry, so registrations must be
// re-appliable per window (see `applyElementRegistrations`).
const elementRegistrations: ElementRegistration[] = [];

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

    if (
        elementRegistrations.some((reg) => reg.name === name) ||
        // Also guards against non-loom code having claimed the name in the
        // live registry (browser path only — off-browser there is no registry
        // yet, and `defineIn` skips per-window duplicates).
        (hasWindow() && getWindow().customElements.get(name))
    ) {
        throw new Error(
            `[loom] A custom element named "${name}" is already defined. Element names are global and cannot be redefined — pick a different name, or ensure the defining module is evaluated only once.`
        );
    }
};

// Builds the element class against a specific window — `extends HTMLElement`
// must resolve to that window's constructor for its document to upgrade the
// element.
const buildElementClass = (
    win: DomWindow,
    { componentFunction, shadow = false, styles }: ElementRegistration
) =>
    class extends win.HTMLElement {
        ctx: ComponentContextPartial = {};
        isWebComponent = true;
        props = {};

        constructor() {
            super();
        }

        connectedCallback() {
            // `Array.from` + `attr.name`/`attr.value`, not
            // `Object.values`/`attr.nodeValue` — linkedom's `NamedNodeMap`
            // leaks an `ownerElement` key through `Object.values` and returns
            // `null` for `nodeValue`; the browser reads identically via both.
            const $props = Array.from(this.attributes).reduce(
                (acc, attr) =>
                    attr.name[0] === '$'
                        ? {
                              ...acc,
                              [toCamelCase(attr.name.slice(1))]: attr.value
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
                props as ComponentInputProps<object>
            );
            const ctx = ctxFn(this.ctx);

            if (shadow) {
                // `attachShadow` throws when a root already exists, which is
                // the case whenever an element is disconnected & reconnected.
                const shadowRoot = this.shadowRoot || this.attachShadow(shadow);

                if (styles?.length) {
                    shadowRoot.adoptedStyleSheets = styles;
                }

                mount(shadowRoot as unknown as Element, ctx);
            } else {
                mount(this, ctx);
            }
        }
    };

const defineIn = (win: DomWindow, registration: ElementRegistration) => {
    if (!win.customElements.get(registration.name)) {
        win.customElements.define(
            registration.name,
            buildElementClass(win, registration)
        );
    }
};

/**
 * Defines every known registration in `win`'s `customElements` registry
 * (already-defined names are skipped). The server entry calls this for each
 * injected window before rendering, since registrations made at app-module
 * load had no window to land in.
 */
export const applyElementRegistrations = (win: DomWindow) =>
    elementRegistrations.forEach((registration) => defineIn(win, registration));

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

    const registration: ElementRegistration = {
        componentFunction,
        name,
        shadow,
        styles
    };

    elementRegistrations.push(registration);

    // In a browser this defines immediately, as before. Off-browser (server
    // module load) the registration waits for `applyElementRegistrations`.
    if (hasWindow()) {
        defineIn(getWindow(), registration);
    }
};
