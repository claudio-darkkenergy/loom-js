import classNames from 'classnames';

import {
    ActivityContext,
    ComponentFunction,
    NodeTemplateFunctionProps,
    PlainObject
} from '@framework/index.d';

export const Styled = <T>(
    Component: ComponentFunction<T>,
    styles: PlainObject | ((props: T) => PlainObject)
) => (props: NodeTemplateFunctionProps<T>, ctx?: ActivityContext) => {
    const fragment = Component(props, ctx);

    // A rerendered component will return undefined b/c only updates to the DOM were made.
    // The fragment will be defined on initial render, only.
    if (fragment) {
        if (fragment.children.length > 1) {
            throw Error(
                `A Styled Component should only have one root node | received ${fragment.children.length} root nodes -> ${fragment}`
            );
        }

        fragment.children[0].className = classNames(
            typeof styles === 'function' ? styles(props) : styles
        );
    }

    return fragment;
};
