import { mergeAllowedAttrs } from '../../../helpers';
import {
    type Aria,
    type AttrsTemplateTagValue,
    type ComponentProps,
    component
} from '@loom-js/core';

type RawButtonProps = {
    aria?: Aria;
    disabled?: boolean;
    title?: string;
    type?: ButtonType;
};

export enum ButtonType {
    Button = 'button',
    Reset = 'reset',
    Submit = 'submit'
}

export type ButtonProps = ComponentProps<RawButtonProps>;

export const Button = component<RawButtonProps>(
    (
        html,
        {
            aria = {},
            attrs,
            children,
            disabled,
            on,
            onClick,
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
                $click=${onClick}
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
