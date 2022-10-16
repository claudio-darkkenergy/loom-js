import { component } from '@loom-js/core';

import styles from './styles.scss';

interface FooterProps {
    copyright: number;
}

export const Footer = component<FooterProps>(
    (Template, { copyright }) => Template`

    <footer class="bg-dark ${styles.footer}">
        <span>&copy; Copyright ${copyright}</span>
    </footer>

`
);
