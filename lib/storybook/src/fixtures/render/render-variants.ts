import type {
    ComponentInputProps,
    Component,
    SimpleComponent,
    GetProps
} from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';

export type RenderVariantsStoryProps<Props extends object = {}> =
    ComponentInputProps<
        Omit<UlProps, 'item'> & {
            itemProps: ComponentInputProps<Props>[];
        }
    >;

export const RenderVariants =
    (
        item: Component | SimpleComponent,
        overrideProps?: (
            variantProps: RenderVariantsStoryProps<
                NonNullable<GetProps<typeof item>>
            >
        ) => Partial<
            RenderVariantsStoryProps<NonNullable<GetProps<typeof item>>>
        >
    ) =>
    (
        unorderedListProps: RenderVariantsStoryProps<
            NonNullable<GetProps<typeof item>>
        >
    ) => {
        const overrides = {
            ...unorderedListProps,
            ...(overrideProps?.(unorderedListProps) || {})
        };

        return Ul({
            ...overrides,
            item,
            style: Object.assign(
                { display: 'flex', gap: '30px', 'flex-wrap': 'wrap' },
                overrides.style
            )
        });
    };
