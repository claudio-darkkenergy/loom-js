import PageLayout from './layout';
import { Bootstrap } from '@/app/bootstrap';
import {
    type ComponentOptionalProps,
    type ContextFunction,
    createRoutes
} from '@loom-js/core';

const Routes = createRoutes({
    config: {
        '/': () => import('@/app/pages/'),
        '/docs/:topic': () => import('@/app/pages/docs/')
    }
});

export default Bootstrap(
    ({
        className,
        style,
        ...props
    }: ComponentOptionalProps): ContextFunction | undefined =>
        PageLayout({
            children: Routes(props),
            className,
            style
        })
);
