import classNames from 'classnames';

import {
    ActivityContext,
    ComponentFunction,
    NodeTemplateFunctionProps,
    PlainObject
} from './types';

export const Styled = <T>(
    Component: ComponentFunction<T>,
    styles: string | PlainObject | ((props: T) => PlainObject)
) => {
    let rootNode: Element;

    return (props: NodeTemplateFunctionProps<T>, ctx?: ActivityContext) => {
        const fragment = Component(props, ctx);
        rootNode = rootNode || fragment.children[0];

        // A rerendered component will return undefined b/c only updates to the DOM were made.
        // The fragment will be defined on initial render, only.
        if (rootNode) {
            if (fragment?.children.length > 1) {
                throw Error(
                    `A Styled Component should only have one root node | received ${fragment.children.length} root nodes -> ${fragment}`
                );
            }

            rootNode.classList.add(
                ...classNames(
                    typeof styles === 'function' ? styles(props) : styles
                ).split(' ')
            );
        }

        return fragment;
    };
};
