import { canDebug } from '../../config';
import { ComponentContext } from '../../types';
import { memo } from '../memo';
import { getAttrUpdate } from './get-attr-update';
import { getDynamicElement } from './get-dynamic-element';
import { getLiveTextNodes } from './get-live-text-nodes';
import { getTextUpdate } from './get-text-update';
import { setReactiveUpdates } from './set-reactive-updates';
import type { DynamicNode } from './types';

export const setUpdatesForPaths = (
    paths: Set<[number[], Attr | undefined]>,
    ctx: ComponentContext,
    liveFragment: DocumentFragment
) => {
    canDebug('updates') && console.group('Set Updates for Paths');
    const getDynamicElementMemo = memo<
        [number[], DocumentFragment],
        DynamicNode
    >((_cacheClean, ...args) => {
        return getDynamicElement(...args);
    });

    const getLiveTextNodesMemo = memo<
        [DynamicNode, DocumentFragment],
        IterableIterator<Text>
    >(
        (_cacheClean, ...args) => {
            return getLiveTextNodes(...args);
        },
        (...[dynamicNode]) => dynamicNode
    );

    Array.from(paths)
        .map(([nodePath, dynamicAttr]): [DynamicNode, Attr | undefined] => [
            getDynamicElementMemo(nodePath, liveFragment),
            dynamicAttr
        ])
        .forEach(([dynamicNode, dynamicAttr], i) => {
            canDebug('updates') &&
                console.group(`Node Path [${Array.from(paths)[i][0]}]`);

            // When the dynamic node is `Text` it can have 1 or more dynamic slot
            if (dynamicAttr) {
                const update = getAttrUpdate(dynamicNode, dynamicAttr);
                // Setup effect udpate.
                setReactiveUpdates(update, i, ctx);
            } else if (
                // `Comment` could be enabled here, then handled in `getTextUpdate` if support
                // becomes needed.
                dynamicNode instanceof Text ||
                dynamicNode === undefined
            ) {
                // Text Node handling
                const textFragment = document.createDocumentFragment();
                // The original live nodes at this moment, one for each dynamic slot token, will
                // each contain the slot token as text, initially.
                // Then, on future renders, each live node will be updated w/ a resolved value.
                const liveNodeIterator = getLiveTextNodesMemo(
                    dynamicNode,
                    textFragment
                );
                const liveNode = liveNodeIterator.next().value as
                    | Text
                    | undefined;

                if (liveNode) {
                    const update = getTextUpdate(liveNode);

                    // Replace the dynamic single text node w/ all the parsed text nodes,
                    // which includes static (glue/joints) & dynamic (tokenized) nodes.
                    dynamicNode?.replaceWith(textFragment);
                    // Setup effect update.
                    setReactiveUpdates(update, i, ctx);
                } else {
                    console.warn(
                        '[Template Update Warning] The live node is undefined, therefore the update could not be created.'
                    );
                }
            }

            canDebug('updates') && console.groupEnd();
        });

    canDebug('updates') && console.groupEnd();
};
