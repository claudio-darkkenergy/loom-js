import { Decorator } from './types';
import { init } from '@loom-js/core';

export const LoomJsStorybookDecorator: Decorator = (story, ctx) => {
    console.log({ ctx });
    const $storyContainer = document.createElement('div');

    $storyContainer.classList.add('story-container');
    init({
        app: story(),
        root: $storyContainer
    });

    return $storyContainer;
};
