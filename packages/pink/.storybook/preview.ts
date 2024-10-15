import '@appwrite.io/pink';
import '@appwrite.io/pink-icons';
import { LoomJsStorybookDecorator, type Preview } from '@loom-js/storybook';

const { parameters } = (window as any).storybook;

const preview: Preview = {
    decorators: LoomJsStorybookDecorator,
    initialGlobals: {
        theme: 'dark'
    },
    globalTypes: {
        theme: {
            description: 'Global theme for components',
            toolbar: {
                // The label to show for this toolbar item
                title: 'Theme',
                icon: 'circlehollow',
                // Array of plain string values or MenuItem shape (see below)
                items: ['light', 'dark'],
                // Change title based on selected value
                dynamicTitle: true
            }
        }
    },
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
