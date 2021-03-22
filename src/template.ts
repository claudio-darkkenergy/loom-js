import {
    ConfigEvent,
    TemplateContext,
    TemplateNodeUpdate,
    TemplateTagValue
} from './types';
import { config } from '.';

type LiveNode = HTMLElement | Text | (HTMLElement | Text)[];

const templateStore = new Map<
    TemplateStringsArray,
    { fragment: DocumentFragment; paths: Map<number[], Attr[] | undefined> }
>();
const updateStore = new WeakMap<
    Node,
    {
        chunks: TemplateStringsArray;
        updates: TemplateNodeUpdate[];
    }
>();

export function template(
    this: TemplateContext,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
): Node {
    const ctx = this;

    if (!templateStore.has(chunks)) {
        const fragment = document
            .createRange()
            .createContextualFragment(chunks.join(config.TOKEN));
        const treeWalker = document.createTreeWalker(
            fragment,
            window.NodeFilter.SHOW_ALL
        );

        templateStore.set(chunks, {
            fragment,
            paths: setPaths(treeWalker)
        });
    }

    if (
        !updateStore.has(ctx.root as Node) ||
        !document.contains(ctx.root as Node)
    ) {
        const { fragment, paths } = templateStore.get(chunks) || {};
        const liveFragment = fragment
            ? (fragment.cloneNode(true) as DocumentFragment)
            : document.createDocumentFragment();
        // Get all the updaters for each dynamic node path.
        const updates = getLiveUpdates(liveFragment, paths || new Map());

        ctx.root = liveFragment.children[0];

        if (!ctx.root) {
            console.warn(
                `Template must contain only one root node - received ${JSON.stringify(
                    liveFragment.children
                )}`,
                'Any additional node will get thrown out and not be rendered.'
            );
        } else {
            updateStore.set(ctx.root, {
                chunks,
                updates
            });
        }
    }

    updateStore
        .get(ctx.root as Node)
        ?.updates.forEach((update) => update(interpolations));

    return ctx.root || document.createDocumentFragment();
}

const resolveValue = (value: TemplateTagValue) => {
    if (typeof value === 'function') {
        const templateTagValue = value();

        // Make sure the function returns a valid value, not another function.
        return templateTagValue && typeof templateTagValue !== 'function'
            ? templateTagValue
            : '';
    } else {
        return value || '';
    }
};

const setPaths = (treeWalker: TreeWalker) => {
    const paths = new Map<number[], Attr[] | undefined>();
    const getNewPath = (node: Node) => {
        const path: number[] = [];

        do {
            if (node.parentNode) {
                path.unshift(
                    Array.from(node.parentNode.childNodes).indexOf(
                        node as ChildNode
                    )
                );
                node = node.parentNode;
            }
        } while (node !== treeWalker.root);

        return path;
    };

    // Walk the node tree to get all dynamic node paths.
    // The paths will be used to set the updaters.
    while (treeWalker.nextNode()) {
        const currentNode = treeWalker.currentNode as ChildNode;

        if (
            currentNode instanceof HTMLElement ||
            currentNode instanceof SVGElement
        ) {
            // Parse attribute nodes.
            const attrs = Array.from(currentNode.attributes).filter((attr) =>
                config.tokenRe.test(attr.value)
            );

            if (attrs.length) {
                paths.set(getNewPath(currentNode), attrs);
            }
        } else if (
            currentNode instanceof Text &&
            config.tokenRe.test(currentNode.textContent || '')
        ) {
            // Parse text nodes.
            paths.set(getNewPath(currentNode), undefined);
        }
    }

    return paths;
};

const getLiveUpdates = (
    liveFragment: DocumentFragment,
    paths: Map<number[], Attr[]>
): TemplateNodeUpdate[] =>
    Array.from(paths).map(([nodePath, attrs]) => {
        let node = nodePath.reduce<
            DocumentFragment | HTMLElement | SVGElement | Text
        >(
            (parent, i) =>
                parent.childNodes[i] as HTMLElement | SVGElement | Text,
            liveFragment
        );

        if (attrs) {
            // Return the attribute node updater.
            const getAttrUpdates = () =>
                attrs.map((attr) => {
                    let updater: TemplateNodeUpdate;

                    if (attr['nodeName'][0] === '$') {
                        const nodeName = attr.nodeName.slice(1);

                        if (config.events.includes(nodeName as ConfigEvent)) {
                            updater = (values: TemplateTagValue[]) => {
                                const eventValue = values.shift();

                                if (typeof eventValue === 'function') {
                                    node.addEventListener(
                                        nodeName,
                                        eventValue as EventListenerOrEventListenerObject,
                                        false
                                    );
                                } else {
                                    console.warn(
                                        `Template Warning | Invalid attribute value used, "${eventValue}"`
                                    );
                                }
                            };
                        } else {
                            updater = (values: TemplateTagValue[]) => {
                                (node as HTMLElement | SVGElement).setAttribute(
                                    nodeName,
                                    String(resolveValue(values.shift()))
                                );
                            };
                        }

                        // Do cleanup.
                        if (
                            (node as HTMLElement | SVGElement).hasAttribute(
                                attr.name
                            )
                        ) {
                            (node as HTMLElement | SVGElement).removeAttribute(
                                attr.name
                            );
                        }
                    } else {
                        updater = (values: TemplateTagValue[]) => {
                            const attrNode = (node as
                                | HTMLElement
                                | SVGElement).attributes.getNamedItem(
                                attr.name
                            );

                            if (attrNode) {
                                attrNode.value = String(
                                    resolveValue(values.shift())
                                );
                            }
                        };
                    }

                    return updater;
                });
            const attrUpdates = getAttrUpdates();

            return (values: TemplateTagValue[]) =>
                attrUpdates.forEach((update) => update(values));
        } else {
            const textFragment = document.createDocumentFragment();
            // The original live nodes - will update on future renders.
            const liveNodes: LiveNode[] = (node.textContent || '')
                .split(config.TOKEN)
                .reduce<Text[]>((acc, part, i, parts) => {
                    if (part && !/(\r|\n)/.test(part)) {
                        textFragment.appendChild(document.createTextNode(part));
                    }

                    if (i < parts.length - 1) {
                        const dynamicTextNode = document.createTextNode(
                            config.TOKEN
                        );

                        acc.push(textFragment.appendChild(dynamicTextNode));
                    }

                    return acc;
                }, []);
            // Updates the live nodes.
            const liveNodeUpdater = (
                liveNode: LiveNode,
                value: DocumentFragment | HTMLElement | SVGElement | Text,
                i: number
            ) => {
                if (Array.isArray(liveNode)) {
                    const replaceableNode = liveNode.splice(0, 1)[0];

                    liveNode.forEach((node) => node.remove());
                    liveNodes[i] = Array.from(value.childNodes) as LiveNode;
                    replaceableNode.replaceWith(value);
                } else {
                    liveNodes[i] = value as LiveNode;
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
                        const newTextValue = document.createTextNode(
                            String(value)
                        );

                        liveNodeUpdater(liveNode, newTextValue, i);
                    }
                });
            };
        }
    });
