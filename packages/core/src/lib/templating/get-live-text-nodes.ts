import { config } from '../../config';
import type { DynamicNode } from './types';

export const getLiveTextNodes = (
    dynamicNode: DynamicNode,
    textFragment: DocumentFragment
): IterableIterator<Text> => {
    const liveNodes = new Set<Text>(
        (dynamicNode?.textContent || '')
            .split(config.TOKEN)
            .reduce<Text[]>((acc, part, i, parts) => {
                if (part) {
                    // Fills in any connecting parts which contain 1 or more characters
                    // including newline, etc.
                    textFragment.appendChild(document.createTextNode(part));
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
            }, [])
    );

    return liveNodes.values();
};
