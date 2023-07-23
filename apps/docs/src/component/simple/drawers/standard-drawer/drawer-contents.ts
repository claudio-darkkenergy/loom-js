import { component, ComponentNode } from '@loom-js/core';

export interface DrawerContentsProps {
    body: ComponentNode;
    className?: string;
    header?: ComponentNode;
}

export const DrawerContents = component<DrawerContentsProps>(
    (html, { body, className }) => html`
        <div class="${className}">${body}</div>
    `
);
