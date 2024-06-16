import { Decorator } from './types';
import {
    type Component,
    type ContextFunction,
    component,
    init
} from '@loom-js/core';

const StoryAppRoot = component<{ story: Component }>(
    (html, { attrs, story }) => html`
        <div $attrs=${attrs}>${story()}</div>
    `
);

export const LoomJsStorybookDecorator: Decorator = (
    story,
    { parameters: { decorator } }
) => {
    const $storyContainer = document.createElement('div');

    $storyContainer.classList.add('story-container');

    init({
        app: StoryAppRoot({
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
