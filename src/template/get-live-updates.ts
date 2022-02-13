import { config } from '../config';
import {
    ConfigEvent,
    TemplateContext,
    TemplateNodeUpdate,
    TemplateTagValue
} from '../types';
import { resolveValue } from './resolve-value';

type LiveNode = HTMLElement | SVGElement | Text;

export const getLiveUpdates = (
    liveFragment: DocumentFragment,
    paths: Map<number[], Attr[]>
): TemplateNodeUpdate[] =>
    Array.from(paths)
        // Reversing the array of paths fixes a bug where some dynamic nodes
        // would disappear at the end of a node's `childNodes`.
        .reverse()
        .map(([nodePath, attrs]) => {
            let node = nodePath.reduce<
                DocumentFragment | HTMLElement | SVGElement | Text
            >(
                (parent, i) =>
                    parent.childNodes[i] as HTMLElement | SVGElement | Text,
                liveFragment
            );

            if (attrs) {
                // Attribute handling
                // Return the attribute node updater.
                const getAttrUpdates = () =>
                    attrs.map((attr) => {
                        let updater: TemplateNodeUpdate;

                        // Special attributes start w/ `$`.
                        if (attr['nodeName'][0] === '$') {
                            const nodeName = attr.nodeName.slice(1);

                            if (
                                config.events.includes(nodeName as ConfigEvent)
                            ) {
                                // Handle special dom-event attributes.
                                let eventListener: EventListenerOrEventListenerObject;

                                updater = (values: TemplateTagValue[]) => {
                                    const eventValue = values.shift();

                                    if (eventListener) {
                                        // Remove the old `EventListener` to prevent them from stacking on the node.
                                        (
                                            node as HTMLElement | SVGElement
                                        ).removeEventListener(
                                            nodeName,
                                            eventListener,
                                            false
                                        );
                                    }

                                    // Special event attrs' values must be a function.
                                    if (typeof eventValue === 'function') {
                                        eventListener =
                                            eventValue as EventListenerOrEventListenerObject;
                                        (
                                            node as HTMLElement | SVGElement
                                        ).addEventListener(
                                            nodeName,
                                            eventListener,
                                            false
                                        );
                                    }
                                    // Falsy is okay - warn for anything else.
                                    // This is non-breaking, so just want to warn in case the provided value was a mistake.
                                    else if (eventValue) {
                                        console.warn(
                                            `[Template Update Warning] The provided special attribute ("${
                                                attr['nodeName']
                                            }") contains a value of ${JSON.stringify(
                                                eventValue
                                            )} which may not be the intended value. While this is non-breaking, a valid value would be falsy or an event-listener.`
                                        );
                                    }
                                };
                            } else {
                                // Safely handle other attrs which are not known dom-event attrs.
                                updater = (values: TemplateTagValue[]) => {
                                    const value = String(
                                        resolveValue(values.shift())
                                    );
                                    const element = node as
                                        | HTMLElement
                                        | SVGElement;

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
                            if (
                                (node as HTMLElement | SVGElement).hasAttribute(
                                    attr.name
                                )
                            ) {
                                (
                                    node as HTMLElement | SVGElement
                                ).removeAttribute(attr.name);
                            }
                        } else {
                            // Handle dynamic standard attributes.
                            updater = (values: TemplateTagValue[]) => {
                                const value = String(
                                    resolveValue(values.shift())
                                );
                                const element = node as
                                    | HTMLElement
                                    | SVGElement;

                                if (value) {
                                    if (
                                        attr.name === 'type' &&
                                        value === 'number' &&
                                        isNaN((element as any).value)
                                    ) {
                                        // Fixes "The specified value * cannot be parsed, or is out of range." warning which occurs on inputs
                                        // where the type will be set to 'number' while the current value is not a parsable number value.
                                        // In this case, the value attribute should be set to a parsable value by calling `setAttribute`.
                                        (element as HTMLInputElement).value =
                                            '';
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
                        }

                        return updater;
                    });
                const attrUpdates = getAttrUpdates();

                return (values: TemplateTagValue[]) =>
                    attrUpdates.forEach((update) => update(values));
            } else {
                // Text Node handling
                const liveNodeCtxWeakMap = new WeakMap<
                    LiveNode | LiveNode[],
                    TemplateContext
                >();
                const textFragment = document.createDocumentFragment();
                // The original live nodes - will update on future renders.
                const liveNodes: (LiveNode | LiveNode[])[] = (
                    node.textContent || ''
                )
                    .split(config.TOKEN)
                    .reduce<Text[]>((acc, part, i, parts) => {
                        if (part) {
                            // Fills in any connecting parts which contain 1 or more characters
                            // including newline, etc.
                            textFragment.appendChild(
                                document.createTextNode(part)
                            );
                        }

                        if (i < parts.length - 1) {
                            const dynamicTextNode = document.createTextNode(
                                config.TOKEN
                            );

                            // Re-adds the dynamic text node using the `TOKEN` & pushes it into
                            // the `liveNodes` array - to be replaced during the intial update.
                            acc.push(textFragment.appendChild(dynamicTextNode));
                        }

                        return acc;
                    }, []);
                // Updates a single live node - 1 for 1.
                const liveNodeUpdater = (
                    liveNode: LiveNode | LiveNode[],
                    value: LiveNode,
                    i: number
                ) => {
                    let replaceableNode: LiveNode;

                    if (Array.isArray(liveNode)) {
                        replaceableNode = liveNode.splice(0, 1)[0];
                        liveNode.forEach((node) => node.remove());
                    } else {
                        replaceableNode = liveNode;
                    }

                    // Handle a single-value live node (1 for 1.)
                    liveNodes[i] = value as LiveNode;

                    // Only replace if the node is different than what's currently live to avoid unnecessary paints.
                    if (!replaceableNode.isSameNode(value)) {
                        replaceableNode.replaceWith(value);
                    }
                };

                // Replace the dynamic single text node w/ all the parsed text nodes,
                // which includes static (glue/joints) & dynamic (tokenized) nodes.
                (node as Text)?.replaceWith(textFragment);

                // Return the text node updater.
                return (values: TemplateTagValue[]) => {
                    // Update for each `LiveNode`.
                    liveNodes.forEach((liveNode, i) => {
                        const ctx = liveNodeCtxWeakMap.get(liveNode) || {};
                        const value = resolveValue(values.shift(), ctx);

                        if (
                            value instanceof HTMLElement ||
                            value instanceof SVGElement
                        ) {
                            // Handle `Element` nodes.
                            liveNodeCtxWeakMap.set(value, ctx);
                            liveNodeUpdater(liveNode, value, i);
                        } else if (Array.isArray(value)) {
                            const liveNodeIsArray = Array.isArray(liveNode);
                            const liveNodeParent = liveNodeIsArray
                                ? liveNode[0].parentElement
                                : (liveNode as LiveNode).parentElement;
                            let lastResolvedValue: LiveNode;

                            if (!value.length) {
                                // Ensure a value array has at least one defined value.
                                value.push(document.createTextNode(''));
                            }

                            // Update the DOM  w/ the pending (new) nodes.
                            liveNodes[i] = value.map((newVal, j) => {
                                // The resolved `TemplateTagValue` coerced to `LiveNode`.
                                let currentLiveNode: LiveNode;
                                // The `TemplateContext` (cached or newly created.)
                                const ctx = liveNodeIsArray
                                    ? liveNodeCtxWeakMap.get(liveNode[j]) || {}
                                    : {};
                                // The resolve `TemplateTagValue`
                                const resolvedValue = resolveValue(newVal, ctx);

                                if (
                                    resolvedValue instanceof HTMLElement ||
                                    resolvedValue instanceof SVGElement
                                ) {
                                    // Handle `Element` nodes.
                                    liveNodeCtxWeakMap.set(resolvedValue, ctx);

                                    // Handle single `LiveNode` updates.
                                    if (!liveNodeIsArray) {
                                        // Insert before the live node.
                                        // The live node will be removed from the DOM after all insertions.
                                        liveNodeParent.insertBefore(
                                            resolvedValue,
                                            liveNode
                                        );
                                    }
                                    // Handle `LiveNode[]` updates when the resolved vs. live nodes are not the same.
                                    else if (
                                        !resolvedValue.isSameNode(liveNode[j])
                                    ) {
                                        if (liveNode[j] !== undefined) {
                                            liveNode[j].replaceWith(
                                                resolvedValue
                                            );
                                        }
                                        // Handle `undefined` live node
                                        else if (
                                            lastResolvedValue.nextSibling
                                        ) {
                                            // Insert before the last updated node.
                                            liveNodeParent.insertBefore(
                                                resolvedValue,
                                                lastResolvedValue.nextSibling
                                            );
                                        } else {
                                            // Or append to the live node parent if there are no "next" siblings.
                                            liveNodeParent.appendChild(
                                                resolvedValue
                                            );
                                        }
                                    }

                                    lastResolvedValue = currentLiveNode =
                                        resolvedValue;
                                } else {
                                    // Handle `Text` nodes.
                                    // Coerce to a valid `LiveNode` as if not already.
                                    const textValue =
                                        resolvedValue instanceof Text
                                            ? resolvedValue
                                            : document.createTextNode(
                                                  String(resolvedValue)
                                              );

                                    // Handle single `LiveNode` updates.
                                    if (!liveNodeIsArray) {
                                        // Insert before the live node.
                                        // The live node will be removed from the DOM after all insertions.
                                        liveNodeParent.insertBefore(
                                            textValue,
                                            liveNode
                                        );
                                    } else {
                                        // Handle `undefined` live node
                                        // Always replace when the new value is `Text`.
                                        liveNode[j].replaceWith(textValue);
                                    }

                                    lastResolvedValue = currentLiveNode =
                                        textValue;
                                }

                                return currentLiveNode;
                            });

                            if (liveNodeIsArray) {
                                // Cleanup the excess old live nodes.
                                (liveNode as LiveNode[])
                                    .slice(value.length)
                                    .forEach((node) => node.remove());
                            } else {
                                // Cleanup the old live node anchor.
                                (liveNode as LiveNode).remove();
                            }
                        } else {
                            // Handle text nodes.
                            const newTextValue =
                                value instanceof Node
                                    ? (value as Text)
                                    : document.createTextNode(String(value));

                            liveNodeUpdater(liveNode, newTextValue, i);
                        }
                    });
                };
            }
        })
        // Reverse the updaters back to the original order before the paths were reversed.
        .reverse();
