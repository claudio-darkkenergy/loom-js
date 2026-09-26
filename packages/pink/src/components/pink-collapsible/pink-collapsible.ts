import {
    el,
    simple,
    type ComponentInputProps,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

const CollapsibleList = simple<ComponentInputProps>(({ className, ...props }) =>
    el('ul')({ ...props, className: classNames(className, 'collapsible') })
);

export type PinkCollapsibleButtonProps = {
    /** Extra classes for the trailing cheveron icon. */
    iconClassName?: string;
    /** Renders the muted trailing label (e.g. `(optional)`). */
    optionalLabel?: TemplateTagValue;
};

// Internal — a button only exists as the wrapper's first child, and the
// item's disabled state decides its element (no `<summary>` outside a
// `<details>`), so it renders from `buttonProps` and can never mismatch.
const CollapsibleButton = simple<
    ComponentInputProps<PinkCollapsibleButtonProps & { isDisabled?: boolean }>
>(
    ({
        children,
        className,
        iconClassName,
        isDisabled,
        optionalLabel,
        ...props
    }) =>
        el(isDisabled ? 'div' : 'summary')({
            ...props,
            children: [
                children,
                optionalLabel
                    ? el('span')({
                          children: optionalLabel,
                          className: 'collapsible-button-optional'
                      })
                    : undefined,
                el('div')({
                    children: el('span')({
                        attrs: { 'aria-hidden': true },
                        className: classNames(
                            'icon-cheveron-down',
                            iconClassName
                        )
                    }),
                    className: 'icon'
                })
            ].flat(),
            className: classNames(className, 'collapsible-button')
        })
);

export type PinkCollapsibleItemProps = {
    /** The header — rendered as the item's button ahead of the content. */
    buttonProps?: ComponentInputProps<PinkCollapsibleButtonProps>;
    /** Extra props (e.g. classes) for the content region wrapping `children`. */
    contentProps?: ComponentInputProps;
    /**
     * Renders the `is-disabled` state — as `<div>`s, since a `<details>`
     * can't be disabled natively and a disclosure that never opens would
     * misannounce to assistive tech.
     */
    isDisabled?: boolean;
    /** Renders the disclosure open — native `<details>` handles toggling. */
    isOpen?: boolean;
};

const CollapsibleItem = simple<ComponentInputProps<PinkCollapsibleItemProps>>(
    ({
        buttonProps,
        children,
        className,
        contentProps,
        isDisabled,
        isOpen,
        ...props
    }) =>
        el('li')({
            ...props,
            children: el(isDisabled ? 'div' : 'details')({
                attrs: isDisabled ? {} : { open: isOpen },
                children: [
                    CollapsibleButton({ ...buttonProps, isDisabled }),
                    el('div')({
                        ...contentProps,
                        children,
                        className: classNames(
                            contentProps?.className,
                            'collapsible-content'
                        )
                    })
                ],
                className: classNames('collapsible-wrapper', {
                    'is-disabled': isDisabled
                })
            }),
            className: classNames(className, 'collapsible-item')
        })
);

export type PinkCollapsibleProps = PinkCollapsibleItemProps & {
    /** Renders the muted label after the title (e.g. `(optional)`). */
    optionalLabel?: TemplateTagValue;
    /** The always-visible header label. */
    title?: TemplateTagValue;
};

/**
 * Collapsibles display a vertical list of headers that reveal or hide
 * content, progressively disclosing information — headers can also carry
 * checkboxes, info avatars, or a disabled state (see the stories). Called
 * directly it renders the single-item form, `children` filling the content
 * region; accordions and custom headers compose the compound parts: `List`
 * and `Item` (the native `<details>` disclosure — `buttonProps` render its
 * header, `contentProps` style its content region).
 */
const Collapsible = simple<ComponentInputProps<PinkCollapsibleProps>>(
    ({
        buttonProps,
        children,
        className,
        contentProps,
        isDisabled,
        isOpen,
        optionalLabel,
        title,
        ...props
    }) =>
        CollapsibleList({
            ...props,
            children: CollapsibleItem({
                // `title`/`optionalLabel` own the header's content; other
                // `buttonProps` (e.g. classes) pass through.
                buttonProps: {
                    ...buttonProps,
                    children: el('span')({
                        children: title,
                        className: 'text'
                    }),
                    optionalLabel
                },
                children,
                contentProps,
                isDisabled,
                isOpen
            }),
            className
        })
);

export const PinkCollapsible = Object.assign(Collapsible, {
    Item: CollapsibleItem,
    List: CollapsibleList
});
