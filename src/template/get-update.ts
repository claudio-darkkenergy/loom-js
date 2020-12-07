import { config } from '../config';
import { ConfigEvent, TemplateNodeUpdate, TemplateTagValue } from '../types';

export const getUpdate = (node: ChildNode) => {
    if (node instanceof HTMLElement || node instanceof SVGElement) {
        // Handle Attr Node types.
        return getElementAttributeUpdates(node);
    } else if (node.parentNode) {
        // Handle Text & Node types.
        return getTextUpdates(
            node.parentNode,
            Array.from(node.parentNode.childNodes).indexOf(node)
        );
    } else {
        return () => {};
    }
};

function getAttributeUpdate(attr: Attr): TemplateNodeUpdate {
    // Memoize the original attribute to keep as the template for new updates.
    // Otherwise, consecutive updates would use the original attribute which would have lost
    // it's original update signature.
    const attrTemplate = attr.cloneNode();

    return (values) =>
        (attr.textContent = <string>(
            (attrTemplate.textContent || '')
                .split(config.TOKEN)
                .reduce((acc, part, _i) => [acc, values.shift(), part].join(''))
        ));
}

function getElementAttributeUpdates(
    node: HTMLElement | SVGElement | any
): TemplateNodeUpdate {
    const dynamicAttrs = Array.from(node.attributes as NamedNodeMap).filter(
        (attr: Attr) =>
            config.tokenRe.test(attr['value'] as string) ||
            config.tokenRe.test(attr['name'])
    );

    // @TODO Make configurable.
    const specialAttrToken = '$';
    const updates = dynamicAttrs.map((attr) => {
        if (attr['nodeName'][0] === specialAttrToken) {
            // Handle special attributes.
            return getSpecialAttributeUpdate(attr);
        } else {
            // Handle standard attributes.
            return getAttributeUpdate(attr);
        }
    });

    return (values) => updates.forEach((update) => update(values));
}

function getSpecialAttributeUpdate(specialAttr: Attr): TemplateNodeUpdate {
    let nodeUpdate: TemplateNodeUpdate;
    const owner = specialAttr.ownerElement;

    if (!owner) {
        throw Error(
            `Template Error -> The attribute owner is null for "${specialAttr}"`
        );
    }

    const specialAttrName = specialAttr.nodeName.slice(1) as ConfigEvent;

    switch (specialAttrName as String) {
        case 'height':
            nodeUpdate = (values) => {
                const valueHeight = values.shift() as string;
                owner.setAttribute('height', valueHeight);
            };

            break;
        case 'width':
            nodeUpdate = (values) => {
                const valueWidth = values.shift() as string;
                owner.setAttribute('width', valueWidth);
            };

            break;
        default:
            if (config.events?.includes(specialAttrName)) {
                nodeUpdate = (values) => {
                    const valueClick = values.shift();

                    if (typeof valueClick === 'function') {
                        (owner as HTMLElement).addEventListener(
                            specialAttrName,
                            valueClick,
                            false
                        );
                    } else {
                        throw Error(
                            `Template Error -> Invalid attribute value used, "${valueClick}"`
                        );
                    }
                };
            } else {
                throw Error(
                    `Template Error -> Invalid attribute used, "${specialAttrName}"`
                );
            }
    }

    owner.removeAttributeNode(specialAttr);

    // Remove the special attribute from the ownerElement.
    return (values) => {
        nodeUpdate(values);
    };
}

function getTextUpdates(parent: Node, indexOfNode: number): TemplateNodeUpdate {
    if (!config.global) {
        throw Error(
            `Window must be set on the global config, but got ${config.global}`
        );
    }

    const fragment = config.global.document.createDocumentFragment();
    const getNestedUpdates: (
        part: string,
        i: number,
        parts: string[]
    ) => TemplateNodeUpdate | undefined = (part, i, parts) => {
        if (i >= parts.length - 1) {
            return;
        }

        // The update method
        return (values) => {
            const currentValue: TemplateTagValue = values[0];

            if (!config.global) {
                throw Error(
                    `Window must be set on the global config, but got ${config.global}`
                );
            }

            if (part) {
                fragment.appendChild(
                    config.global.document.createTextNode(part)
                );
            }

            switch (typeof currentValue) {
                case 'number':
                case 'string':
                    if (!config.global) {
                        throw Error(
                            `Window must be set on the global config, but got ${config.global}`
                        );
                    }

                    const htmlRe = /<\/?[a-z][\s\S]*>/;
                    const valueString = String(values.shift());

                    if (htmlRe.test(valueString)) {
                        // Value with markup
                        const range = config.global.document.createRange();
                        const valueFragment = range.createContextualFragment(
                            valueString
                        );

                        fragment.appendChild(valueFragment);
                    } else {
                        fragment.appendChild(
                            config.global.document.createTextNode(valueString)
                        );
                    }

                    break;
                case 'function':
                    throw Error(
                        `Template Error -> Functions are not allowed as values. Received "${currentValue}"`
                    );
                default:
                    // Handle Node type.
                    const value = values.shift() as Node | Node[];

                    if (value instanceof Node) {
                        fragment.appendChild(value);
                    } else if (Array.isArray(value)) {
                        value.forEach((node) => {
                            if (node instanceof Node) {
                                fragment.appendChild(node);
                            }
                        });
                    }
            }
        };
    };
    let liveChildNodes = [parent.childNodes[indexOfNode]];
    const updates = (parent.childNodes[indexOfNode].textContent || '')
        .split(config.TOKEN)
        .map(getNestedUpdates)
        .filter((update) => !!update) as TemplateNodeUpdate[];

    return (values) => {
        updates.forEach((update) => update(values));

        // Update live nodes.
        liveChildNodes.forEach((node) => node.remove());
        liveChildNodes = Array.from(fragment.childNodes)
            .reverse()
            .map((node) => {
                if (node instanceof Node) {
                    parent.insertBefore(node, parent.childNodes[indexOfNode]);
                }

                return node;
            })
            .filter((node) => node);
    };
}
