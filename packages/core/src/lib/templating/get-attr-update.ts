import { canDebug, config } from '../../config';
import type {
    ConfigEvent,
    TemplateNodeUpdate,
    TemplateTagValue
} from '../../types';
import { loomConsole } from '../globals/loom-console';
import { resolveValue } from './resolve-value';
import type { DynamicNode } from './types';

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
    const nodeName = attr.nodeName.slice(1);

    if (config.events.includes(nodeName as ConfigEvent)) {
        // Handle special dom-event attributes.
        let eventListener: EventListenerOrEventListenerObject;

        updater = (newValue: TemplateTagValue) => {
            if (eventListener) {
                // Remove the old `EventListener` to prevent them from stacking on the node.
                (dynamicNode as HTMLElement | SVGElement).removeEventListener(
                    nodeName,
                    eventListener,
                    false
                );
            }

            // Special event attrs' values must be a function.
            if (typeof newValue === 'function') {
                eventListener = newValue as EventListenerOrEventListenerObject;
                (dynamicNode as HTMLElement | SVGElement).addEventListener(
                    nodeName,
                    eventListener,
                    false
                );
            }
            // Falsy is okay - warn for anything else.
            // This is non-breaking, so just want to warn in case the provided value was a mistake.
            else if (newValue) {
                canDebug('warn') &&
                    loomConsole.warn(
                        `[Template Update Warning] The provided special attribute ("${
                            attr['nodeName']
                        }") contains a value of ${JSON.stringify(
                            newValue
                        )} which may not be the intended value. While this is non-breaking, a valid value would be falsy or an event-listener.`
                    );
            }
        };
    } else {
        // Safely handle other attrs which are not known dom-event attrs.
        updater = (newValue: TemplateTagValue) => {
            const value = String(resolveValue(newValue));
            const element = dynamicNode as HTMLElement | SVGElement;

            if (value) {
                element.setAttribute(nodeName, value);
            } else {
                // If `value` is falsy, we'll cleanup the attribute by removing it.
                // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
                element.removeAttribute(nodeName);
            }
        };
    }

    // Do cleanup - remove the special attribute from the node since it's been processed.
    if ((dynamicNode as HTMLElement | SVGElement).hasAttribute(attr.name)) {
        (dynamicNode as HTMLElement | SVGElement).removeAttribute(attr.name);
    }

    return updater;
};
const getStandardAttrUpdate =
    (dynamicNode: DynamicNode, attr: Attr) => (newValue: TemplateTagValue) => {
        const value = String(resolveValue(newValue));
        const element = dynamicNode as HTMLElement | SVGElement;

        if (value) {
            if (
                attr.name === 'type' &&
                value === 'number' &&
                isNaN((element as any).value)
            ) {
                // Fixes "The specified value * cannot be parsed, or is out of range." warning which occurs on inputs
                // where the type will be set to 'number' while the current value is not a parsable number value.
                // In this case, the value attribute should be set to a parsable value by calling `setAttribute`.
                (element as HTMLInputElement).value = '';
            }

            if (attr.name === 'value') {
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
                ).value = value;
            } else {
                element.setAttribute(attr.name, value);
            }
        } else {
            // If `value` is falsy, we'll cleanup the attribute by removing it.
            // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
            element.removeAttribute(attr.name);
        }
    };
