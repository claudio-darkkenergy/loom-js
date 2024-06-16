import '@appwrite.io/pink';
import '@appwrite.io/pink-icons';
import { LoomJsStorybookDecorator, type Preview } from '@loom-js/storybook';

const { parameters } = (window as any).storybook;

const preview: Preview = {
    decorators: LoomJsStorybookDecorator,
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },
        decorator: parameters.decorator.flex.center()
    }
};

export default preview;
