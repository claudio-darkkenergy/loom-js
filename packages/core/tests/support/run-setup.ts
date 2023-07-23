import { Container, ContainerProps } from './components/container';
import { init } from '../../src';

export interface SetupOptions {
    containerProps: ContainerProps;
}

export const runSetup = ({
    containerProps: { className = 'test-scope', ...containerProps }
}: SetupOptions): Promise<HTMLElement> =>
    new Promise((resolve) => {
        const root = document.body.querySelector('main') || document.body;

        // Initialize the app
        init({
            app: Container({
                ...containerProps,
                className
            }),
            append: false,
            onAppMounted: (app) => {
                console.log({ app });
                resolve(
                    // Find & resolve the test-scope node.
                    app.find((node) => {
                        console.log('node', (node as Element).className);
                        return (
                            node instanceof HTMLElement &&
                            Array.from(node.classList).includes('test-scope')
                        );
                    }) as HTMLElement
                );
            },
            root
        });
    });
