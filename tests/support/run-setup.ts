import { Container, ContainerProps } from './components/container';
import { init } from '../../src';

export interface SetupOptions {
    containerProps: ContainerProps;
}

export const runSetup = ({
    containerProps: { className = 'test-scope', ...containerProps }
}: SetupOptions): Promise<HTMLElement> =>
    new Promise((resolve) => {
        const root = document.body;

        // Initialize the app
        init({
            app: Container({
                ...containerProps,
                className
            }),
            append: false,
            onAppMounted: (app) => resolve(app as HTMLElement),
            root
        });
    });
