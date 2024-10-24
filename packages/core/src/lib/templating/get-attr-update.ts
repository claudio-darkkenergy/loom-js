import { canDebug, config } from '../../config';
import type {
    AttrsTemplateTagValue,
    ConfigEvent,
    OnTemplateTagValue,
    PlainObject,
    TemplateNodeUpdate,
    TemplateTagValue,
    TemplateTagValueFunction
} from '../../types';
import { loomConsole } from '../globals/loom-console';
import { isObject } from '../helpers';
import { resolveValue } from './resolve-value';
import type { DynamicNode } from './types';

type BoundSpecialAttrTemplateNodeUpdate = (
    ctx: {
        attr?: Attr;
        dynamicNode: DynamicNode;
        listenerCtx?: ListenerCtx | ListenerCtxCollection;
        nodeName: string;
    },
    newValue: TemplateTagValue
) => void;

interface ListenerCtx {
    eventListener?: EventListenerOrEventListenerObject;
}

interface ListenerCtxCollection {
    [key: string]: ListenerCtx | undefined;
}

export const getAttrUpdate = (dynamicNode: DynamicNode, dynamicAttr: Attr) => {
    // Special attributes start w/ `$`.
    if (dynamicAttr['nodeName'][0] === '$') {
        return getSpecialAttrUpdate(dynamicNode, dynamicAttr);
    }
    // Handle dynamic standard attributes.
    else {
        return getStandardAttrUpdate(dynamicNode, dynamicAttr);
    }
};

const getSpecialAttrUpdate = (dynamicNode: DynamicNode, attr: Attr) => {
    let updater: TemplateNodeUpdate;
    // Removes the prefix "$".
    const nodeName = attr.nodeName.slice(1);
    const listenerCtx: ListenerCtx = {};

    switch (true) {
        case nodeName === 'attrs':
            // Handle special attritbute, `$attrs`, to spread them out onto the dynamic node.
            updater = (
                specialAttrUpdaters.attrs as BoundSpecialAttrTemplateNodeUpdate
            ).bind(null, {
                attr,
                dynamicNode,
                nodeName
            });
            break;
        case nodeName === 'on':
            // Handle special attribute, `$on`, to assign multiple dom-event attributes at once.
            updater = (
                specialAttrUpdaters.on as BoundSpecialAttrTemplateNodeUpdate
            ).bind(null, {
                attr,
                dynamicNode,
                listenerCtx,
                nodeName
            });
            break;
        case config.events.includes(nodeName as ConfigEvent):
            // Handle special dom-event attributes.
            listenerCtx.eventListener = undefined;
            updater = (
                specialAttrUpdaters.event as BoundSpecialAttrTemplateNodeUpdate
            ).bind(null, {
                attr,
                dynamicNode,
                listenerCtx,
                nodeName
            });
            break;
        default:
            // Safely handle other standard attrs or those which are not known dom-event attrs.
            updater = (
                specialAttrUpdaters.default as BoundSpecialAttrTemplateNodeUpdate
            ).bind(null, {
                attr,
                dynamicNode,
                nodeName
            });
    }

    // Do cleanup - remove the special attribute from the node since it's been processed.
    if ((dynamicNode as HTMLElement | SVGElement).hasAttribute(attr.name)) {
        (dynamicNode as HTMLElement | SVGElement).removeAttribute(attr.name);
    }

    return updater;
};

const getStandardAttrUpdate =
    (dynamicNode: DynamicNode, attr: Attr) => (newValue: TemplateTagValue) => {
        // Special attributes start w/ `$`.
        let nodeName =
            attr['nodeName'][0] === '$'
                ? attr.nodeName.slice(1)
                : attr.nodeName;
        const value = resolveValue(newValue);
        const element = dynamicNode as HTMLElement | SVGElement;

        if (value) {
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
                    mergeAndSetStyleValues(
                        element,
                        value as TemplateTagValue[]
                    );
                    break;
                case nodeName === 'style' && isObject(value):
                    Object.entries(value).forEach(([propName, val]) => {
                        val && element.style.setProperty(propName, val);
                    });
                    break;
                default:
                    element.setAttribute(nodeName, String(value));
            }
        } else {
            // If `value` is falsy, we'll cleanup the attribute by removing it.
            // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
            element.removeAttribute(nodeName);
        }
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
            !['contextFunction', 'activityContextFunction'].includes(
                styleArg.name
            )
        ) {
            handleStyleArg((styleArg as TemplateTagValueFunction)());
        } else if (isObject(styleArg)) {
            Object.entries(styleArg as PlainObject<string | null>).forEach(
                ([propName, value]) => {
                    value && $target.style.setProperty(propName, value);
                }
            );
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

const specialAttrUpdaters: {
    [key: string]: BoundSpecialAttrTemplateNodeUpdate;
} = {
    attrs: ({ attr, dynamicNode, nodeName }, newValue) => {
        // The new value must be an object literal.
        if (!newValue || !isObject(newValue)) {
            newValue &&
                canDebug('warn') &&
                loomConsole.warn(
                    `${attr?.nodeName} must be an object literal.`
                );
            return;
        }

        const element = dynamicNode as HTMLElement | SVGElement;

        // Loop to set the attrs.
        Object.entries(newValue as AttrsTemplateTagValue).forEach(
            ([key, value]) => {
                const resolvedValue = resolveValue(value);

                // Falsy value - remove the attribute from the element.
                if (!Boolean(resolvedValue)) {
                    element.removeAttribute(nodeName);
                    return;
                }

                switch (true) {
                    case key === 'className':
                        resolvedValue &&
                            element.classList.add(
                                ...String(resolvedValue).split(/(?:\s)+/g)
                            );
                        break;
                    // Handle style as Array of possible style values,
                    // ie. ['ruleName: value;', { ruleName: 'value' }, undefined, false].
                    case key === 'style' && Array.isArray(resolvedValue):
                        mergeAndSetStyleValues(
                            element,
                            resolvedValue as TemplateTagValue[]
                        );
                        break;
                    // Handle style as `CSSStyleDeclaration` object notation.
                    case key === 'style' && isObject(resolvedValue):
                        Object.entries(resolvedValue).forEach(
                            ([propName, value]) => {
                                value &&
                                    element.style.setProperty(propName, value);
                            }
                        );
                        break;
                    // Truthy value exists - add and/or set the attribute & its value.
                    default:
                        element.setAttribute(key, String(resolvedValue));
                        break;
                }
            }
        );
    },
    default: ({ attr, dynamicNode }, newValue) => {
        getStandardAttrUpdate(dynamicNode, attr as Attr)(newValue);
    },
    event: (
        { attr, dynamicNode, listenerCtx, nodeName },
        newValue: TemplateTagValue
    ) => {
        overrideEventListener({
            attr: attr as Attr,
            dynamicNode,
            listenerCtx,
            nodeName,
            override: newValue
        });
    },
    on: (
        { attr, dynamicNode, listenerCtx: listenerCtxCollection },
        newValue: TemplateTagValue
    ) => {
        // The new value must be an object literal.
        if (!newValue || !isObject(newValue)) {
            newValue &&
                canDebug('warn') &&
                loomConsole.warn(
                    `${attr?.nodeName} must be an object literal.`
                );
            return;
        }

        Object.entries(newValue as OnTemplateTagValue).forEach(
            ([key, value]) => {
                const listeners =
                    listenerCtxCollection as ListenerCtxCollection;

                if (config.events.includes(key as ConfigEvent)) {
                    if (listeners[key]?.eventListener !== value) {
                        listeners[key] = listeners[key] || {
                            eventListener: value
                        };
                    }

                    overrideEventListener({
                        attr: attr as Attr,
                        dynamicNode,
                        listenerCtx: listeners[key],
                        nodeName: key,
                        override: value
                    });
                }
            }
        );
    }
};
