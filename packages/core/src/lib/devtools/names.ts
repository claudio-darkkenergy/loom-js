import type { ComponentContextPartial, TemplateFunction } from '../../types';

interface DisplayName {
    explicit: boolean;
    name: string;
}

// Keyed by template function — the identity a context carries as its
// `fingerPrint` — so a name resolves from any live instance.
const displayNames = new WeakMap<TemplateFunction<any>, DisplayName>();
const elementTags = new WeakMap<TemplateFunction<any>, string>();
// Each component callable's template function, so a name given against the
// callable (the build tool's injection) lands on the right key.
const componentTemplates = new WeakMap<object, TemplateFunction<any>>();

/**
 * Records the template function behind a component callable, and its
 * explicit `name` option when given.
 * @param componentFunction The callable `component()` returns.
 * @param templateFunction The template function it renders.
 * @param name The explicit display name, if any.
 */
export const recordComponent = (
    componentFunction: object,
    templateFunction: TemplateFunction<any>,
    name?: string
) => {
    componentTemplates.set(componentFunction, templateFunction);
    name && displayNames.set(templateFunction, { explicit: true, name });
};

/**
 * Records the custom-element tag a `defineElement` component registers.
 * @param templateFunction The component's template function.
 * @param tag The registered element name.
 */
export const recordElementTag = (
    templateFunction: TemplateFunction<any>,
    tag: string
) => {
    elementTags.set(templateFunction, tag);
};

/**
 * Names a component from its declaring binding — the build tool's injection
 * target. An explicit `name` option always wins; an unknown callable is
 * ignored.
 * @param componentFunction The component callable.
 * @param name The binding name.
 */
export const nameComponent = (componentFunction: unknown, name: string) => {
    const templateFunction =
        typeof componentFunction === 'function'
            ? componentTemplates.get(componentFunction)
            : undefined;

    templateFunction &&
        !displayNames.get(templateFunction)?.explicit &&
        displayNames.set(templateFunction, { explicit: false, name });
};

/**
 * Resolves the display name of a component instance: `Name <tag>` for a
 * named element, `<tag>` for an unnamed one, the name otherwise, and
 * `Anonymous` when nothing names it.
 * @param ctx The component context.
 * @returns The display name.
 */
export const displayNameOf = (ctx: ComponentContextPartial) => {
    const templateFunction = ctx.fingerPrint;
    const name = templateFunction && displayNames.get(templateFunction)?.name;
    const tag = templateFunction && elementTags.get(templateFunction);

    return tag ? (name ? `${name} <${tag}>` : `<${tag}>`) : name || 'Anonymous';
};
