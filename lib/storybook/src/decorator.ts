import { Decorator } from './types';
import {
    type Component,
    type ContextFunction,
    component,
    init
} from '@loom-js/core';

const StoryApp = component<{ story: Component }>(
    (html, { attrs, story }) => html`
        <div id="story-app" $attrs=${attrs}>${story()}</div>
    `
);

export const LoomJsStorybookDecorator: Decorator = (
    story,
    { parameters: { decorator } }
) => {
    const $storyContainer = document.createElement('div');

    $storyContainer.id = 'story-container';

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
