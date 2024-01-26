import { component, Component } from '@loom-js/core';

import styles from './styles.scss';

export interface StandardLayoutProps {
    bodyTop?: Component;
    footer?: Component;
    header?: Component;
    leftAside?: Component;
    main?: Component;
}

export const StandardLayout = component<StandardLayoutProps>(
    (html, { bodyTop, footer, header, leftAside, main }) => html`
        <div class="${styles.standardLayout}">
            ${bodyTop} ${header} ${leftAside} ${main} ${footer}
        </div>
    `
);
