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
) => (
    props = {} as NodeTemplateFunctionProps<T>,
    ctx = {} as ActivityContext
) => {
    const fragment = Component(props, ctx);

    // A rerendered component will return undefined b/c only updates to the DOM were made.
    // The fragment will be defined on initial render, only.
    if (fragment?.children.length > 1) {
        throw Error(
            `A Styled Component should only have one root node | received ${fragment.children.length} root nodes -> ${fragment}`
        );
    }

    const classList = classNames(
        typeof styles === 'function' ? styles(props) : styles || ''
    ).split(' ');

    if (classList.length > 1 || classList[0]) {
        (ctx.node as HTMLElement).classList.add(...classList);
    }

    return fragment;
};
