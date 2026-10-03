import { config } from '../../config';
import type {
    AttrsTemplateTagValue,
    ConfigEvent,
    OnTemplateTagValue,
    PlainObject,
    TemplateTagValue,
    TemplateTagValueFunction,
    Unsubscriber
} from '../../types';
import { bindAttr, isAttrBinding } from '../attr-binding';
import { isContextFunction } from '../context/helpers';
import {
    createDiagnosticSubject,
    formatDiagnostic
} from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';
import { isObject } from '../helpers';
import { resolveValue } from './resolve-value';
import type { SlotApplier } from './types';

type DynamicElement = HTMLElement | SVGElement;

type Listener = EventListenerOrEventListenerObject;

// Sets a standard attribute from a resolved slot value.
const setAttrValue = (
    element: DynamicElement,
    name: string,
    newValue: TemplateTagValue
) => {
    const value = resolveValue(newValue);

    // Falsy value - remove the attribute from the element, except the number
    // zero, which is a real attribute value (`tabindex=${0}`, `min=${0}`).
    // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
    if (!(value || value === 0)) {
        element.removeAttribute(name);
        return;
    }

    switch (true) {
        case name === 'type' &&
            value === 'number' &&
            isNaN((element as any).value):
            // Fixes "The specified value * cannot be parsed, or is out of range." warning which occurs on inputs
            // where the type will be set to 'number' while the current value is not a parsable number value.
            // In this case, the value attribute should be set to a parsable value by calling `setAttribute`.
            (element as HTMLInputElement).value = '';
            element.setAttribute(name, String(value));
            break;
        case name === 'value':
            // Set the value prop instead of the value attribute, i.e. using `setAttribute`, which only works when no value
            // has been set for the UI to update at all.
            (
                element as
                    | HTMLButtonElement
                    | HTMLFormElement
                    | HTMLInputElement
                    | HTMLOptionElement
                    | HTMLSelectElement
                    | HTMLTextAreaElement
            ).value = String(value);
            break;
        case name === 'style' && Array.isArray(value):
            replaceInlineStyle(element, () =>
                mergeAndSetStyleValues(element, value as TemplateTagValue[])
            );
            break;
        case name === 'style' && isObject(value):
            replaceInlineStyle(element, () =>
                Object.entries(value).forEach(([propName, val]) => {
                    (val || val === 0) &&
                        element.style.setProperty(propName, String(val));
                })
            );
            break;
        default:
            element.setAttribute(name, String(value));
    }
};

/**
 * Applies a standard attribute slot: a plain value is set at once, an
 * attribute binding is subscribed with at most one live subscription per
 * slot — a re-render disposes the previous one first.
 */
export const applyAttr: SlotApplier = (slot, { name }, newValue, ctx) => {
    const element = slot.node as DynamicElement;
    const unsubscribeBinding = slot.state as Unsubscriber | undefined;

    if (unsubscribeBinding) {
        unsubscribeBinding();
        ctx.teardowns?.delete(unsubscribeBinding);
        slot.state = undefined;
    }

    if (isAttrBinding(newValue)) {
        slot.state = bindAttr(
            (attrValue) => setAttrValue(element, name, attrValue),
            newValue,
            ctx
        );
        return;
    }

    setAttrValue(element, name, newValue);
};

// Replacement semantics for object/array style values: the resolved value
// fully determines the inline style, and an application yielding zero
// properties leaves no `style` attribute behind — so the parsed placeholder
// token never survives an empty-resolving value. The clear goes through the
// CSSOM (`cssText`), not `removeAttribute`: Chrome serializes the style
// attribute lazily after `setProperty`, and a pending flush can resurrect a
// removed attribute as `style=""`. The prune's `getAttribute` read forces
// that flush before deciding.
const replaceInlineStyle = (
    element: DynamicElement,
    applyStyleProps: () => void
) => {
    element.style.cssText = '';
    applyStyleProps();
    element.getAttribute('style') || element.removeAttribute('style');
};

const mergeAndSetStyleValues = (
    $target: DynamicElement,
    styleRules: TemplateTagValue[]
) => {
    const handleStyleArg = (styleArg: TemplateTagValue) => {
        if (typeof styleArg === 'string') {
            styleArg.split(';').forEach((ruleValue) => {
                if (ruleValue) {
                    const [rule, value] = ruleValue.split(':');
                    const trimmedRule = rule?.trim();
                    const trimmedValue = value?.trim();

                    trimmedValue &&
                        trimmedRule &&
                        $target.style.setProperty(trimmedRule, trimmedValue);
                }
            });
        } else if (
            typeof styleArg === 'function' &&
            !isContextFunction(styleArg)
        ) {
            handleStyleArg((styleArg as TemplateTagValueFunction)());
        } else if (isObject(styleArg)) {
            Object.entries(
                styleArg as PlainObject<number | string | null>
            ).forEach(([propName, value]) => {
                (value || value === 0) &&
                    $target.style.setProperty(propName, String(value));
            });
        }
    };

    // Flatten the array of style rules in the case of nested arrays.
    styleRules.flat().forEach(handleStyleArg);
};

// Swaps the listener bound for `eventName`: the previous one is removed so
// listeners never stack, and the listener now attached (if any) is returned.
const overrideEventListener = (
    element: DynamicElement,
    eventName: string,
    current: Listener | undefined,
    override: TemplateTagValue,
    attrName: string
): Listener | undefined => {
    if (typeof current === 'function') {
        element.removeEventListener(eventName, current, false);
    }

    // Special event attrs' values must be a function.
    if (typeof override === 'function') {
        element.addEventListener(
            eventName,
            override as Listener,
            // @TODO Use capture can be detected from the attribute name by parsing it out,
            // i.e. `$click.capture=`
            false
        );

        return override as Listener;
    }

    // Falsy is okay - warn for anything else.
    // This is non-breaking, so just want to warn in case the provided value was a mistake.
    override &&
        loomConsole.warn(
            ...formatDiagnostic({
                detail: `${JSON.stringify(
                    override
                )} is neither falsy nor an event listener, so nothing was bound (non-breaking)`,
                event: 'unexpected special-attribute value',
                remedy: 'pass an event-listener function, or a falsy value to skip binding',
                scope: 'templating',
                subject: createDiagnosticSubject('attr', attrName)
            })
        );

    return undefined;
};

const setCustomElementProps = ({
    appendProps = true,
    attrName,
    element,
    newProps
}: {
    appendProps?: boolean;
    attrName: string;
    element: DynamicElement;
    newProps: object;
}) => {
    const customElement = element as unknown as {
        isWebComponent: boolean;
        props: object;
    };

    if (!customElement.isWebComponent) {
        // Not a registered custom element — either the tag was never passed to
        // `defineElement`, or its defining module had not been evaluated when
        // this template was parsed, so the element was not yet upgraded.
        newProps &&
            loomConsole.warn(
                ...formatDiagnostic({
                    detail: `${attrName} was set, but the element is not a registered custom element`,
                    event: 'ignored props',
                    remedy: 'register it with `defineElement`, and import its module before this template renders',
                    scope: 'templating',
                    subject: createDiagnosticSubject(
                        'element',
                        `<${element.tagName?.toLowerCase()}>`
                    )
                })
            );
        return;
    }

    if (!newProps || !isObject(newProps)) {
        newProps &&
            loomConsole.warn(
                ...formatDiagnostic({
                    detail: 'the value must be an object literal, so it was ignored',
                    event: 'ignored a non-object value',
                    remedy: 'pass an object literal',
                    scope: 'templating',
                    subject: createDiagnosticSubject('attr', attrName)
                })
            );
        return;
    }

    if (appendProps) {
        Object.assign(customElement.props, newProps);
    } else {
        Object.assign(newProps, customElement.props);
    }
};

// Applies one `$attrs` entry to the element — shared by the static path and
// the per-entry binding application.
const applyAttrsEntry = (
    element: DynamicElement,
    key: string,
    value: TemplateTagValue
) => {
    const resolvedValue = resolveValue(value);

    // Falsy value - remove the attribute from the element, except the number
    // zero, which is a real attribute value.
    // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
    if (!(resolvedValue || resolvedValue === 0)) {
        element.removeAttribute(key === 'className' ? 'class' : key);
        return;
    }

    switch (true) {
        case key === 'className' && typeof resolvedValue === 'string':
            resolvedValue && element.setAttribute('class', resolvedValue);

            break;
        // Handle style as Array of possible style values,
        // ie. ['ruleName: value;', { ruleName: 'value' }, undefined, false].
        case key === 'style' && Array.isArray(resolvedValue):
            replaceInlineStyle(element, () =>
                mergeAndSetStyleValues(
                    element,
                    resolvedValue as TemplateTagValue[]
                )
            );
            break;
        // Handle style as `CSSStyleDeclaration` object notation.
        case key === 'style' && isObject(resolvedValue):
            replaceInlineStyle(element, () =>
                Object.entries(resolvedValue).forEach(([propName, value]) => {
                    (value || value === 0) &&
                        element.style.setProperty(propName, String(value));
                })
            );
            break;
        // Truthy value exists - add and/or set the attribute & its value.
        default:
            element.setAttribute(key, String(resolvedValue));
            break;
    }
};

// Warns once per application that a `$attrs`/`$on` value was not an object.
const warnNonObject = (attrName: string) =>
    loomConsole.warn(
        ...formatDiagnostic({
            detail: 'the value must be an object literal, so it was ignored',
            event: 'ignored a non-object value',
            remedy: 'pass an object literal',
            scope: 'templating',
            subject: createDiagnosticSubject('attr', attrName)
        })
    );

/**
 * Applies a dom-event slot (`$click`…): one listener per event per element,
 * the previous listener removed before the next is added.
 */
export const applyEvent: SlotApplier = (slot, { name }, newValue) => {
    slot.state = overrideEventListener(
        slot.node as DynamicElement,
        name,
        slot.state as Listener | undefined,
        newValue,
        `$${name}`
    );
};

/**
 * Applies a `$name` slot that is neither a named special nor a known
 * dom-event attribute: a prop on a registered custom element, else a plain
 * attribute set or removed on the element.
 */
export const applyCustom: SlotApplier = (slot, { name, prop }, newValue) => {
    const element = slot.node as DynamicElement;

    if ((element as unknown as { isWebComponent: boolean }).isWebComponent) {
        setCustomElementProps({
            attrName: `$${name}`,
            element,
            newProps: { [prop as string]: newValue }
        });
    } else {
        const resolvedValue = resolveValue(newValue);

        // Zero is a real attribute value — only other falsy values remove.
        if (!(resolvedValue || resolvedValue === 0)) {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, String(resolvedValue));
        }
    }
};

/**
 * Applies a `$attrs` slot — spreads the given attrs onto the element. Each
 * bound entry keeps one live subscription per key, disposed when a
 * re-render replaces it.
 */
export const applyAttrs: SlotApplier = (slot, _entry, newValue, ctx) => {
    // The new value must be an object literal.
    if (!newValue || !isObject(newValue)) {
        newValue && warnNonObject('$attrs');
        return;
    }

    const element = slot.node as DynamicElement;

    // Loop to set the attrs.
    Object.entries(newValue as AttrsTemplateTagValue).forEach(
        ([key, value]) => {
            const bindings = slot.state as
                Map<string, Unsubscriber> | undefined;
            const previousUnsubscribe = bindings?.get(key);

            if (previousUnsubscribe) {
                // A re-render replaced this entry — dispose the previous
                // binding subscription and deregister its teardown first.
                previousUnsubscribe();
                ctx.teardowns?.delete(previousUnsubscribe);
                bindings?.delete(key);
            }

            if (isAttrBinding(value)) {
                const unsubscribe = bindAttr(
                    (attrValue) => applyAttrsEntry(element, key, attrValue),
                    value,
                    ctx
                );

                ((slot.state ??= new Map()) as Map<string, Unsubscriber>).set(
                    key,
                    unsubscribe
                );
                return;
            }

            applyAttrsEntry(element, key, value);
        }
    );
};

/**
 * Applies an `$on` slot — assigns multiple dom-event listeners at once, one
 * per event per element.
 */
export const applyOn: SlotApplier = (slot, _entry, newValue) => {
    // The new value must be an object literal.
    if (!newValue || !isObject(newValue)) {
        newValue && warnNonObject('$on');
        return;
    }

    const element = slot.node as DynamicElement;

    Object.entries(newValue as OnTemplateTagValue).forEach(([key, value]) => {
        if (!config.events.includes(key as ConfigEvent)) {
            return;
        }

        const listeners = (slot.state ??= new Map()) as Map<string, Listener>;
        const current = listeners.get(key);

        if (current === value) {
            return;
        }

        const listener = overrideEventListener(
            element,
            key,
            current,
            value,
            '$on'
        );

        listener ? listeners.set(key, listener) : listeners.delete(key);
    });
};

/**
 * Applies a `$props` slot — provides the given props to a registered custom
 * element; ignored on any other element.
 */
export const applyProps: SlotApplier = (slot, _entry, newValue) => {
    setCustomElementProps({
        appendProps: false,
        attrName: '$props',
        element: slot.node as DynamicElement,
        newProps: newValue as object
    });
};
