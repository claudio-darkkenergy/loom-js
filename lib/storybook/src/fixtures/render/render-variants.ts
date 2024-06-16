import type {
    ContextFunction,
    ComponentProps,
    TemplateTagValue
} from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';

export type RenderVariantsStoryArgs = ReturnType<
    ReturnType<typeof RenderVariants>
>;

export type RenderVariantsStoryProps<T extends object = {}> = ComponentProps<
    Omit<UlProps, 'item'> & {
        itemProps: ComponentProps<T>[];
    }
>;

export const RenderVariants =
    <T extends (props: any) => ContextFunction | TemplateTagValue>(
        item: T,
        overrideProps?: (
            variantProps: RenderVariantsStoryProps
        ) => Partial<RenderVariantsStoryProps>
    ) =>
    (unorderedListProps: RenderVariantsStoryProps<Parameters<T>>) => {
        const overrides = {
            ...unorderedListProps,
            ...(overrideProps?.(unorderedListProps) || {})
        };

        return Ul({
            ...overrides,
            item,
            style: [
                { display: 'flex', gap: '30px', 'flex-wrap': 'wrap' },
                overrides.style
            ]
        });
    };
