import { component, Component } from '@loom-js/core';

export interface DrawerContentsProps {
    body: Component;
    className?: string;
    header?: Component;
}

export const DrawerContents = component<DrawerContentsProps>(
    (html, { body, className }) => html`
        <div class="${className}">${body}</div>
    `
);
