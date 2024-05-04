import { LoomJsStorybookDecorator, type Preview } from '@loom-js/storybook';

const preview: Preview = {
    decorators: [LoomJsStorybookDecorator],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    }
};

export default preview;
