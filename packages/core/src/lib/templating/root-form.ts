import { getWindow } from '../dom';

/**
 * Classifies a parsed template's root form from its top-level nodes.
 * Exactly one element, with whitespace-only text ignored, is a single root.
 * Anything else is a fragment root: several nodes, text, a comment, or a
 * dynamic slot.
 */
export const isFragmentRoot = (fragment: DocumentFragment) => {
    const { Node } = getWindow();
    let elementCount = 0;

    for (const node of Array.from(fragment.childNodes)) {
        switch (true) {
            case node.nodeType === Node.ELEMENT_NODE:
                elementCount++;
                break;
            case node.nodeType === Node.TEXT_NODE && !node.textContent?.trim():
                break;
            default:
                return true;
        }
    }

    return elementCount !== 1;
};
