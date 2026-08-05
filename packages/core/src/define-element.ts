import { component } from './component';
// Imported by path rather than through `./lib/templating` — the barrel is
// pulled in by every consumer, and re-exporting registration from it would
// keep this module in bundles that never call `defineElement`.
import { registerCustomElement } from './lib/templating/register-custom-element';
import type {
    Component,
    DefineElementOptions,
    TemplateFunction
} from './types';

/**
 * Defines a component *and* registers it as a custom element, so a non-loom
 * page can consume it as `<element-name>`.
 *
 * Use this instead of `component()` — never both for the same component.
 * `component()` alone defines no element.
 *
 * ```ts
 * export const Card = component((html, props) => html`…`);
 * export const PinkButton = defineElement('pink-button', (html, props) => html`…`);
 * ```
 *
 * Content renders into the light DOM by default, where application CSS applies
 * normally. Pass `shadow` to encapsulate instead, and `styles` to push
 * stylesheets across the shadow boundary — nothing about a shadow root inherits
 * document styles.
 *
 * @param name - The custom element name. Must contain a hyphen.
 * @param templateFunction - The component's render function.
 * @param options - Shadow root and stylesheet options.
 * @returns The `Component`, directly callable in loom templates as usual.
 */
export const defineElement = <Props extends object = {}>(
    name: string,
    templateFunction: TemplateFunction<Props>,
    options: DefineElementOptions = {}
): Component<Props> => {
    const componentFunction = component<Props>(templateFunction);

    registerCustomElement<Props>({
        ...options,
        componentFunction,
        name
    });

    return componentFunction;
};
