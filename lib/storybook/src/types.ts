import type { ComponentInputProps, TemplateTagValue } from '@loom-js/core';
import type {
    AnnotatedStoryFn,
    Args,
    ComponentAnnotations,
    DecoratorFunction,
    ProjectAnnotations,
    StoryAnnotations,
    StrictArgs,
    WebRenderer
} from '@storybook/types';

export interface LoomJsRenderer extends WebRenderer {
    storyResult: TemplateTagValue;
}

// Storybook's own decorator shape over the loom renderer: the story fn
// yields a `TemplateTagValue` (a `Node` is one), so a decorator may return
// either a template value or the element it mounted into.
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

export type StoryObj<TArgs extends object = Args> = StoryAnnotations<
    LoomJsRenderer,
    ComponentInputProps<TArgs>
>;

/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryFn<TArgs = Args> = AnnotatedStoryFn<LoomJsRenderer, TArgs>;
