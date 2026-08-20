import type {
    ComponentContextPartial,
    Placement,
    TemplateRoot,
    TemplateRootArray
} from '../types';
import { getDocument } from './dom';

// Mount the `componentNode`.
export const mount = (
    root: Element = getDocument().body,
    componentNode: ComponentContextPartial | TemplateRoot | TemplateRootArray,
    placement: Placement = 'replace'
) => {
    const doMount = (nodeOrNodes: TemplateRoot | TemplateRootArray) => {
        const templateRootArray = Array.isArray(nodeOrNodes)
            ? nodeOrNodes
            : [nodeOrNodes];

        switch (placement) {
            case 'append':
                root.append(...templateRootArray);
                break;
            case 'prepend':
                root.prepend(...templateRootArray);
                break;
            default:
                // Ensure the root element is empty.
                root.replaceChildren(...templateRootArray);
        }
    };

    if (componentNode.hasOwnProperty('root')) {
        const ctx = componentNode as ComponentContextPartial;
        ctx.root && doMount(ctx.root);
    } else {
        doMount(componentNode as TemplateRoot | TemplateRootArray);
    }
};
