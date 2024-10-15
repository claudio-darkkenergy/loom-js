import { Decorator } from './types';
import {
    type Component,
    type ContextFunction,
    component,
    init
} from '@loom-js/core';

const StoryApp = component<{ story: Component }>((html, { attrs, story }) => {
    return html`
        <div $attrs=${attrs} id="story-app">${story()}</div>
    `;
});

export const LoomJsStorybookDecorator: Decorator = (
    story,
    { globals: { theme }, parameters: { decorator } }
) => {
    const $storyContainer = document.createElement('div');

    $storyContainer.id = 'story-container';

    // Set theme
    setTheme(theme);

    init({
        app: StoryApp({
            attrs: {
                className: decorator?.className,
                style: decorator?.style
            },
            story
        }),
        root: $storyContainer
    });

    return $storyContainer as unknown as ContextFunction;
};

enum LoomTheme {
    Dark = 'dark',
    Light = 'light'
}

const setTheme = (theme: LoomTheme) => {
    if (theme === LoomTheme.Dark) {
        document.body.classList.add(`theme-${LoomTheme.Dark}`);
    } else {
        document.body.classList.remove(`theme-${LoomTheme.Dark}`);
    }
};
