import { Component } from '@loom-js/core';

import { DrawerContents } from './drawer-contents';
import { Drawer, DrawerProps } from '@app/components/simple/drawers';

export interface StandardDrawerProps extends Omit<DrawerProps, 'contents'> {
    body: Component;
    header?: Component;
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
