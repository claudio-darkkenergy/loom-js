import { config } from '../config';
import { ConfigEvent, TemplateNodeUpdate, TemplateTagValue } from '../types';
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
                                const attrNode =
                                    element.attributes.getNamedItem(attr.name);

                                if (attrNode) {
                                    if (value) {
                                        attrNode.value = String(value);
                                    } else {
                                        // If `value` is falsy, we'll cleanup the attribute by removing it.
                                        // Removing the attribute also solves for boolean attributes, i.e. `disabled`.
                                        element.removeAttributeNode(attrNode);
                                    }
                                } else if (value) {
                                    element.setAttribute(attr.name, value);
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
                // Updates the live nodes.
                const liveNodeUpdater = (
                    liveNode: LiveNode | LiveNode[],
                    value: DocumentFragment | LiveNode,
                    i: number
                ) => {
                    if (Array.isArray(liveNode)) {
                        const replaceableNode = liveNode.splice(0, 1)[0];

                        // Clear out the live node array...
                        liveNode.forEach((node) => node.remove());
                        // ...then reassign it to the new live node array.
                        liveNodes[i] = Array.from(
                            value.childNodes
                        ) as LiveNode[];
                        replaceableNode.replaceWith(value);
                    } else {
                        if (value instanceof DocumentFragment) {
                            // Handle a `DocumentFragment` properly, which can contain any
                            // number of child nodes & is array-like (`LiveNode[]`.)
                            const nodes = Array.from(
                                value.childNodes
                            ) as LiveNode[];

                            // If there are no child nodes, then create a new text node to
                            // become the live node.
                            liveNodes[i] = nodes.length
                                ? nodes
                                : value.appendChild(
                                      document.createTextNode('')
                                  );
                        } else {
                            // Handle a single-value live node (1 for 1.)
                            liveNodes[i] = value as LiveNode;
                        }

                        liveNode.replaceWith(value);
                    }
                };

                // Replace the dynamic text node w/ the parsed nodes (static vs. dynamic.)
                (node as Text)?.replaceWith(textFragment);

                // Return the text node updater.
                return (values: TemplateTagValue[]) => {
                    // Update for each `LiveNode`.
                    liveNodes.forEach((liveNode, i) => {
                        const value = resolveValue(values.shift());

                        if (
                            value instanceof HTMLElement ||
                            value instanceof SVGElement
                        ) {
                            // Handle `Element` nodes.
                            liveNodeUpdater(liveNode, value, i);
                        } else if (Array.isArray(value)) {
                            // Update the textFragment w/ the pending (new) nodes.
                            value.forEach((newVal) => {
                                const resolvedValue = resolveValue(newVal);

                                if (
                                    resolvedValue instanceof HTMLElement ||
                                    resolvedValue instanceof SVGElement
                                ) {
                                    textFragment.appendChild(resolvedValue);
                                } else {
                                    textFragment.appendChild(
                                        document.createTextNode(
                                            String(resolvedValue)
                                        )
                                    );
                                }
                            });

                            liveNodeUpdater(liveNode, textFragment, i);
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
