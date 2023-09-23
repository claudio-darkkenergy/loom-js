import type { DynamicNode } from './types';

// Finds the `Element`.
export const getDynamicElement = (
    nodePath: number[],
    liveFragment: DocumentFragment
) =>
    nodePath.reduce<DynamicNode>(
        (parent, i) => parent.childNodes[i] as HTMLElement | SVGElement | Text,
        liveFragment
    );
