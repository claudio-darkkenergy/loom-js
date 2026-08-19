import { canDebug, config } from '../../config';
import type {
    AttrsTemplateTagValue,
    ComponentContextPartial,
    ConfigEvent,
    OnTemplateTagValue,
    PlainObject,
    TemplateNodeUpdate,
    TemplateTagValue,
    TemplateTagValueFunction,
    Unsubscriber
} from '../../types';
import { bindAttr, isAttrBinding } from '../attr-binding';
import { loomConsole } from '../globals/loom-console';
import { isObject, toCamelCase } from '../helpers';
import { resolveValue } from './resolve-value';
import type { DynamicNode } from './types';

// Bind-time inputs shared by every special-attr updater factory. Each factory
// closes over whatever per-attribute state it needs (a binding registry, a
// listener context) and returns the update function for that attribute.
interface SpecialAttrUpdaterArgs {
    attr: Attr;
    dynamicNode: DynamicNode;
    // The component context owning this template — the teardown root
    // where binding subscriptions register (`add-reactive-attr-bindings`
    // design D2).
    hostCtx?: ComponentContextPartial;
    nodeName: string;
}

type SpecialAttrUpdaterFactory = (
    args: SpecialAttrUpdaterArgs
) => TemplateNodeUpdate;

interface ListenerCtx {
    eventListener?: EventListenerOrEventListenerObject;
}

interface ListenerCtxCollection {
    [key: string]: ListenerCtx | undefined;
}

export const getAttrUpdate = (
    dynamicNode: DynamicNode,
    dynamicAttr: Attr,
    hostCtx?: ComponentContextPartial
) => {
    // Special attributes start w/ `$`.
    if (dynamicAttr['nodeName'][0] === '$') {
        return getSpecialAttrUpdate(dynamicNode, dynamicAttr, hostCtx);
    }
    // Handle dynamic standard attributes.
    else {
        return getStandardAttrUpdate(dynamicNode, dynamicAttr, hostCtx);
    }
};

const getSpecialAttrUpdate = (
    dynamicNode: DynamicNode,
    attr: Attr,
    hostCtx?: ComponentContextPartial
) => {
    // Removes the prefix "$".
    const nodeName = attr.nodeName.slice(1);
    // Precedence: named special attributes, then known dom-event attributes
    // (dynamic via `config.events`, so they can't be static map keys), then
    // the safe default.
    const updaterFactory =
        specialAttrUpdaterFactories[nodeName] ??
        (config.events.includes(nodeName as ConfigEvent)
            ? eventUpdaterFactory
            : defaultUpdaterFactory);
    const updater = updaterFactory({ attr, dynamicNode, hostCtx, nodeName });

    // Do cleanup - remove the special attribute from the node since it's been processed.
    if ((dynamicNode as HTMLElement | SVGElement).hasAttribute(attr.name)) {
        (dynamicNode as HTMLElement | SVGElement).removeAttribute(attr.name);
    }

    return updater;
};

const getStandardAttrUpdate = (
    dynamicNode: DynamicNode,
    attr: Attr,
    hostCtx?: ComponentContextPartial
) => {
    // At most one live binding subscription per attr slot
    // (`add-reactive-attr-bindings` design D3).
    let unsubscribeBinding: Unsubscriber | undefined;
    const applyValue = (newValue: TemplateTagValue) => {
        // Special attributes start w/ `$`.
        let nodeName =
            attr['nodeName'][0] === '$'
                ? attr.nodeName.slice(1)
                : attr.nodeName;
        const value = resolveValue(newValue);
        const element = dynamicNode as HTMLElement | SVGElement;

        // Falsy value - remove the attribute from the element, except the number
        // zero, which is a real attribute value (`tabindex=${0}`, `min=${0}`).
        // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
        if (!(value || value === 0)) {
            element.removeAttribute(nodeName);
            return;
        }

        switch (true) {
            case nodeName === 'type' &&
                value === 'number' &&
                isNaN((element as any).value):
                // Fixes "The specified value * cannot be parsed, or is out of range." warning which occurs on inputs
                // where the type will be set to 'number' while the current value is not a parsable number value.
                // In this case, the value attribute should be set to a parsable value by calling `setAttribute`.
                (element as HTMLInputElement).value = '';
                element.setAttribute(nodeName, String(value));
                break;
            case nodeName === 'value':
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
            case nodeName === 'style' && Array.isArray(value):
                replaceInlineStyle(element, () =>
                    mergeAndSetStyleValues(element, value as TemplateTagValue[])
                );
                break;
            case nodeName === 'style' && isObject(value):
                replaceInlineStyle(element, () =>
                    Object.entries(value).forEach(([propName, val]) => {
                        (val || val === 0) &&
                            element.style.setProperty(propName, String(val));
                    })
                );
                break;
            default:
                element.setAttribute(nodeName, String(value));
        }
    };

    return (newValue: TemplateTagValue) => {
        if (unsubscribeBinding) {
            // A re-render replaced the slot's value — dispose the previous
            // binding subscription and deregister its teardown first.
            unsubscribeBinding();
            hostCtx?.teardowns?.delete(unsubscribeBinding);
            unsubscribeBinding = undefined;
        }

        if (isAttrBinding(newValue)) {
            unsubscribeBinding = bindAttr(applyValue, newValue, hostCtx);
            return;
        }

        applyValue(newValue);
    };
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
    element: HTMLElement | SVGElement,
    applyStyleProps: () => void
) => {
    element.style.cssText = '';
    applyStyleProps();
    element.getAttribute('style') || element.removeAttribute('style');
};

const mergeAndSetStyleValues = (
    $target: HTMLElement | SVGElement,
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
            !styleArg.name.toLowerCase().endsWith('contextfunction')
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

const overrideEventListener = ({
    attr,
    dynamicNode,
    listenerCtx,
    nodeName,
    override
}: {
    attr: Attr;
    dynamicNode: DynamicNode;
    listenerCtx?: ListenerCtx;
    nodeName: string;
    override?: TemplateTagValue;
}) => {
    const element = dynamicNode as HTMLElement | SVGElement;

    if (typeof listenerCtx?.eventListener === 'function') {
        // Remove the old `EventListener` to prevent them from stacking on the node.
        element.removeEventListener(
            nodeName,
            listenerCtx?.eventListener,
            false
        );
    }

    // Special event attrs' values must be a function.
    if (typeof override === 'function' && listenerCtx) {
        listenerCtx.eventListener =
            override as EventListenerOrEventListenerObject;
        element.addEventListener(
            nodeName,
            listenerCtx.eventListener,
            // @TODO Use capture can be detected from the attribute name by parsing it out,
            // i.e. `$click.capture=`
            false
        );
    }
    // Falsy is okay - warn for anything else.
    // This is non-breaking, so just want to warn in case the provided value was a mistake.
    else if (override) {
        canDebug('warn') &&
            loomConsole.warn(
                `[Template Update Warning] The provided special attribute ("${
                    attr.nodeName
                }") contains a value of ${JSON.stringify(
                    override
                )} which may not be the intended value. While this is non-breaking, a valid value would be falsy or an event-listener.`
            );
    }
};

const setCustomElementProps = ({
    appendProps = true,
    attr,
    dynamicNode,
    newProps
}: {
    appendProps?: boolean;
    attr: Attr;
    dynamicNode: DynamicNode;
    newProps: object;
}) => {
    const customElement = dynamicNode as unknown as {
        isWebComponent: boolean;
        props: object;
    };

    if (!customElement.isWebComponent) {
        // Not a registered custom element — either the tag was never passed to
        // `defineElement`, or its defining module had not been evaluated when
        // this template was parsed, so the element was not yet upgraded.
        newProps &&
            canDebug('warn') &&
            loomConsole.warn(
                `${attr?.nodeName} was set on <${(
                    dynamicNode as HTMLElement
                ).tagName?.toLowerCase()}>, which is not a registered custom element. Register it with \`defineElement\`, and make sure its module is imported before this template renders.`
            );
        return;
    }

    if (!newProps || !isObject(newProps)) {
        newProps &&
            canDebug('warn') &&
            loomConsole.warn(`${attr?.nodeName} must be an object literal.`);
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
    element: HTMLElement | SVGElement,
    key: string,
    value: TemplateTagValue
) => {
    const resolvedValue = resolveValue(value);

    // Falsy value - remove the attribute from the element, except the number
    // zero, which is a real attribute value.
    // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
    // (Previously removed the literal `$attrs` node name — a latent bug.)
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

// Handles the special dom-event attributes, i.e. `$click`.
const eventUpdaterFactory: SpecialAttrUpdaterFactory = ({
    attr,
    dynamicNode,
    nodeName
}) => {
    const listenerCtx: ListenerCtx = { eventListener: undefined };

    return (newValue: TemplateTagValue) => {
        overrideEventListener({
            attr,
            dynamicNode,
            listenerCtx,
            nodeName,
            override: newValue
        });
    };
};

// Safely handles other standard attrs or those which are not known dom-event attrs.
const defaultUpdaterFactory: SpecialAttrUpdaterFactory = ({
    attr,
    dynamicNode,
    nodeName
}) => {
    return (newValue: TemplateTagValue) => {
        const isCustomElement = (
            dynamicNode as unknown as {
                isWebComponent: boolean;
            }
        ).isWebComponent;

        if (isCustomElement) {
            setCustomElementProps({
                attr,
                dynamicNode,
                newProps: { [toCamelCase(nodeName)]: newValue }
            });
        } else {
            const element = dynamicNode as HTMLElement | SVGElement;
            const resolvedValue = resolveValue(newValue);

            // Zero is a real attribute value — only other falsy values remove.
            if (!(resolvedValue || resolvedValue === 0)) {
                element.removeAttribute(nodeName);
            } else {
                element.setAttribute(nodeName, String(resolvedValue));
            }
        }
    };
};

// Named special attributes (`$attrs`, `$on`, `$props`) dispatch through this
// map — a new special attribute type is one new entry here, with no edit to
// the dispatch in `getSpecialAttrUpdate`.
const specialAttrUpdaterFactories: {
    [key: string]: SpecialAttrUpdaterFactory;
} = {
    // `$attrs` — spreads the given attrs out onto the dynamic node.
    attrs: ({ attr, dynamicNode, hostCtx }) => {
        // Active binding unsubscribers per attr key, for re-render swap
        // disposal (`add-reactive-attr-bindings` design D3).
        const bindingRegistry = new Map<string, Unsubscriber>();

        return (newValue: TemplateTagValue) => {
            // The new value must be an object literal.
            if (!newValue || !isObject(newValue)) {
                newValue &&
                    canDebug('warn') &&
                    loomConsole.warn(
                        `${attr.nodeName} must be an object literal.`
                    );
                return;
            }

            const element = dynamicNode as HTMLElement | SVGElement;

            // Loop to set the attrs.
            Object.entries(newValue as AttrsTemplateTagValue).forEach(
                ([key, value]) => {
                    const previousUnsubscribe = bindingRegistry.get(key);

                    if (previousUnsubscribe) {
                        // A re-render replaced this entry — dispose the previous
                        // binding subscription and deregister its teardown first.
                        previousUnsubscribe();
                        hostCtx?.teardowns?.delete(previousUnsubscribe);
                        bindingRegistry.delete(key);
                    }

                    if (isAttrBinding(value)) {
                        const unsubscribe = bindAttr(
                            (attrValue) =>
                                applyAttrsEntry(element, key, attrValue),
                            value,
                            hostCtx
                        );

                        bindingRegistry.set(key, unsubscribe);
                        return;
                    }

                    applyAttrsEntry(element, key, value);
                }
            );
        };
    },
    // `$on` — assigns multiple dom-event attributes at once.
    on: ({ attr, dynamicNode }) => {
        const listeners: ListenerCtxCollection = {};

        return (newValue: TemplateTagValue) => {
            // The new value must be an object literal.
            if (!newValue || !isObject(newValue)) {
                newValue &&
                    canDebug('warn') &&
                    loomConsole.warn(
                        `${attr.nodeName} must be an object literal.`
                    );
                return;
            }

            Object.entries(newValue as OnTemplateTagValue).forEach(
                ([key, value]) => {
                    if (config.events.includes(key as ConfigEvent)) {
                        if (listeners[key]?.eventListener !== value) {
                            listeners[key] = listeners[key] || {
                                eventListener: value
                            };
                        }

                        overrideEventListener({
                            attr,
                            dynamicNode,
                            listenerCtx: listeners[key],
                            nodeName: key,
                            override: value
                        });
                    }
                }
            );
        };
    },
    // `$props` — provides the given props to the dynamic node, used for
    // custom elements, otherwise ignored.
    props: ({ attr, dynamicNode }) => {
        return (newValue: TemplateTagValue) => {
            setCustomElementProps({
                appendProps: false,
                attr,
                dynamicNode,
                newProps: newValue as object
            });
        };
    }
};
