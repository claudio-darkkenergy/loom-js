import { component, onRoute } from '@loomjs/core';

import { ReactiveSiteNavDrawer } from '@app/component/reactive/site-nav-drawer';
import { LinkProps } from '@app/component/simple';

export interface LeftAsideProps {
    navigation: Omit<LinkProps, 'onClick'>[];
}

export const LeftAside = component<LeftAsideProps>(
    (html, { navigation }) =>
        html`<aside>
            ${ReactiveSiteNavDrawer(() => ({ navigation, onClick: onRoute }))}
        </aside>`
);
