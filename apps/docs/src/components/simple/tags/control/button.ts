import { Aria, AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export interface ButtonProps {
    aria?: Aria;
    disabled?: boolean;
    title?: string;
    type?: ButtonType;
}

export enum ButtonType {
    Button = 'button',
    Submit = 'submit'
}

export const Button = component<ButtonProps>(
    (
        html,
        {
            aria = {},
            attrs,
            children,
            disabled,
            on,
            title,
            type = ButtonType.Button,
            ...buttonProps
        }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            buttonProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <button
                $attrs=${attrsOverrides}
                $on=${on}
                aria-label=${aria.label}
                disabled=${disabled}
                title=${title}
                type=${type}
            >
                ${children}
            </button>
        `;
    }
);
