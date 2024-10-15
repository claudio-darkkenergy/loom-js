import type { Component, ContextFunction } from '@loom-js/core';
import type {
    AnnotatedStoryFn,
    Args,
    ComponentAnnotations,
    ProjectAnnotations,
    Renderer,
    StoryAnnotations,
    StoryContext,
    StrictArgs,
    WebRenderer
} from '@storybook/types';

export interface LoomJsRenderer extends WebRenderer {
    storyResult: ContextFunction | ContextFunction[];
}

type DecoratorFunction<TRenderer extends Renderer = Renderer, TArgs = Args> = (
    fn: Component,
    c: StoryContext<TRenderer, TArgs>
) => TRenderer['storyResult'];

export type Decorator<TArgs = StrictArgs> = DecoratorFunction<
    LoomJsRenderer,
    TArgs
>;

/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/formats/component-story-format/#default-export)
 */
export type Meta<TArgs = Args> = ComponentAnnotations<LoomJsRenderer, TArgs>;

export type Preview = ProjectAnnotations<LoomJsRenderer>;

export type StoryObj<TArgs = Args> = StoryAnnotations<LoomJsRenderer, TArgs>;

/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryFn<TArgs = Args> = AnnotatedStoryFn<LoomJsRenderer, TArgs>;
