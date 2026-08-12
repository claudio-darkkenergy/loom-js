import {
    el,
    type ComponentInputProps,
    type Component,
    type SimpleComponent,
    type GetProps
} from '@loom-js/core';

export type RenderVariantsStoryProps<Props extends object = {}> =
    ComponentInputProps<{
        itemProps: ComponentInputProps<Props>[];
        listItemProps?: ComponentInputProps;
    }>;

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

        const { itemProps, listItemProps, style, ...ulProps } = overrides;

        return el('ul')({
            ...ulProps,
            children: itemProps?.map((props) =>
                el('li')({ ...listItemProps, children: item(props) })
            ),
            style: Object.assign(
                { display: 'flex', gap: '30px', 'flex-wrap': 'wrap' },
                style
            )
        });
    };
