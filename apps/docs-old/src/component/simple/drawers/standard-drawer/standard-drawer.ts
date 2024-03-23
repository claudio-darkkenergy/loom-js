import { Component } from '@loom-js/core';

import { Drawer, DrawerProps } from '@app/component/simple/drawers';

import { DrawerContents } from './drawer-contents';

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
