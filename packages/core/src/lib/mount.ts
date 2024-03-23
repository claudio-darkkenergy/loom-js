import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray
} from '../types';

// Mount the `componentNode`.
export const mount = (
    root: Element = document.body,
    componentNode: ComponentContextPartial | TemplateRoot | TemplateRootArray,
    append: Boolean | null = null
) => {
    const doMount = (nodeOrNodes: TemplateRoot | TemplateRootArray) => {
        const templateRootArray = Array.isArray(nodeOrNodes)
            ? nodeOrNodes
            : [nodeOrNodes];

        switch (append) {
            case null:
                // Ensure the root element is empty.
                root.replaceChildren(...templateRootArray);
                break;
            case false:
                // Prepend to the root element.
                root.prepend(...templateRootArray);
                break;
            default:
                // Append to the root element.
                root.append(...templateRootArray);
        }
    };

    if (componentNode.hasOwnProperty('root')) {
        const ctx = componentNode as ComponentContextPartial;
        ctx.root && doMount(ctx.root);
    } else {
        doMount(componentNode as TemplateRoot | TemplateRootArray);
    }
};
