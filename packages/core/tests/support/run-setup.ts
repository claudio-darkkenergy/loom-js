import { Container, ContainerProps } from './components/container';
import { AppInitProps, ComponentOptionalProps, init } from '../../src';

export interface SetupOptions {
    appInitProps?: {} | AppInitProps;
    containerProps: ContainerProps & ComponentOptionalProps;
}

export const runSetup = ({
    appInitProps = {},
    containerProps: { className = 'test-scope', ...containerProps }
}: SetupOptions) =>
    new Promise<HTMLElement>((resolve) => {
        // Initialize the app
        init({
            app: Container({
                ...containerProps,
                className
            }),
            append: false,
            onAppMounted: (app) => {
                // console.log('contains app?', document.contains(app));
                // console.log('document.body', document.body);
                resolve(app as HTMLElement);
            },
            ...appInitProps
        });
    });
