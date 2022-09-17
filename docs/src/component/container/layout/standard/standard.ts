import { component, ComponentNode } from '@loomjs/core';

import styles from './styles.scss';

export interface StandardLayoutProps {
    bodyTop?: ComponentNode;
    footer?: ComponentNode;
    header?: ComponentNode;
    leftAside?: ComponentNode;
    main?: ComponentNode;
}

export const StandardLayout = component<StandardLayoutProps>(
    (html, { bodyTop, footer, header, leftAside, main }) => html`
        <div class="${styles.standardLayout}">
            ${bodyTop} ${header} ${leftAside} ${main} ${footer}
        </div>
    `
);
