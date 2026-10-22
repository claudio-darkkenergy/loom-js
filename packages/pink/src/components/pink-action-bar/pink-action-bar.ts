import { component, type ComponentInputProps } from '@loom-js/core';

import { cn } from '../../utils/cn';

export type PinkActionBarProps = ComponentInputProps<{
    startContent?: ComponentInputProps;
    endContent?: ComponentInputProps;
}>;

export const PinkActionBar = component<PinkActionBarProps>(
    (
        html,
        { attrs, className, endContent, id, on, onClick, startContent, style }
    ) => html`
        <section
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${cn(className, 'action-bar')}
            id=${id}
            style=${style}
        >
            <div
                $attrs=${startContent?.attrs}
                $click=${startContent?.onClick}
                $on=${startContent?.on}
                class=${cn(
                    'action-bar-start u-flex u-gap-8',
                    startContent?.className
                )}
                id=${startContent?.id}
                style=${startContent?.style}
            >
                ${startContent?.children}
            </div>
            <div
                $attrs=${endContent?.attrs}
                $click=${endContent?.onClick}
                $on=${endContent?.on}
                class=${cn(
                    'action-bar-end u-flex u-gap-8',
                    endContent?.className
                )}
                id=${endContent?.id}
                style=${endContent?.style}
            >
                ${endContent?.children}
            </div>
        </section>
    `
);
