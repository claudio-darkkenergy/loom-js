import { ComponentNode } from '@loomjs/core';

import { Drawer, DrawerProps } from '@app/component/simple/drawers';

import { DrawerContents } from './drawer-contents';

export interface StandardDrawerProps extends Omit<DrawerProps, 'contents'> {
    body: ComponentNode;
    header?: ComponentNode;
}

export const StandardDrawer = ({
    body,
    header,
    ...drawProps
}: StandardDrawerProps) =>
    Drawer({
        ...drawProps,
        contents: DrawerContents({
            body,
            header
        })
    });
