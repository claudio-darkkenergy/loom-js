import { createRoutes, type SimpleComponent } from '@loom-js/core';

import { RoutePath } from './constants';
import PageLayout from './layout';
import { Bootstrap } from '@/app/bootstrap';

const Routes = createRoutes({
    config: {
        [RoutePath.Home]: () => import('@/app/pages/'),
        [RoutePath.Docs]: () => import('@/app/pages/docs/')
    }
});

const App: SimpleComponent = ({ className, style, ...props }) =>
    PageLayout({
        children: Routes(props),
        className,
        style
    });

export default Bootstrap(App);
