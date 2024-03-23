import { SimpleComponent } from '@loom-js/core';

import { AppLayout } from '@app/components/container/layout/app-layout';
import { PinkGridBox, PinkSideNav } from '@loom-js/pink';

export const LearnPage: SimpleComponent = ({ style }) => {
    console.log({ style });
    return AppLayout({
        mainContent: ({ page, site }) => {
            console.log({ page, site });
            return PinkGridBox({
                children: [
                    PinkSideNav({
                        style
                    })
                ]
            });
        },
        style
    });
};
