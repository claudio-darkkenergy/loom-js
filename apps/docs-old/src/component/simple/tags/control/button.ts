import { Aria, component, MouseEventListener } from '@loom-js/core';

export interface ButtonProps {
    aria?: Aria;
    disabled?: boolean;
    onClick?: MouseEventListener;
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
            children,
            className,
            disabled,
            onClick = () => {},
            title,
            type = ButtonType.Button
        }
    ) => html`
        <button
            $click=${onClick}
            aria-label=${aria.label}
            class=${className}
            disabled=${disabled}
            title=${title}
            type=${type}
        >
            ${children}
        </button>
    `
);
