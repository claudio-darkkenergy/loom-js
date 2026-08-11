import { component } from '../component';
import { VOID_TAG } from '../lib/templating/compile-component-tags/grammar';
import type { Component, ComponentContext, TemplateTagValue } from '../types';

// Plain HTML tags as component values — for `is=` polymorphism, third-party
// render callbacks, and props transformers, wherever element syntax needs an
// element as a value. Memoization is correctness, not convenience: template
// contexts cache by chunks-array identity, so each tag must own a single
// stable chunks array or re-renders would never reuse DOM.
const tagComponents = new Map<string, Component>();

export const el = (tagName: string): Component => {
    const tag = tagName.toLowerCase();
    let tagComponent = tagComponents.get(tag);

    if (!tagComponent) {
        const isVoid = VOID_TAG.test(tag);
        const chunks = [`<${tag} $attrs=`, ' $on=', ' class='].concat(
            isVoid ? [' />'] : ['>', `</${tag}>`]
        );

        tagComponent = component((html, { attrs, children, className, on }) => {
            const values: TemplateTagValue[] = [attrs, on, className];

            if (!isVoid) {
                values.push(children);
            }

            return (
                html as unknown as (
                    tagChunks: string[],
                    ...tagValues: TemplateTagValue[]
                ) => ComponentContext
            )(chunks, ...values);
        });
        tagComponents.set(tag, tagComponent);
    }

    return tagComponent;
};
