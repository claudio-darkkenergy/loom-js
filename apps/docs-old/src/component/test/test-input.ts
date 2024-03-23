import { component, MouseEventListener } from '@loom-js/core';

export interface InputProps {
    autocomplete?: boolean;
    className?: string;
    disabled?: boolean;
    max?: number | string;
    min?: number | string;
    name: string;
    onChange?: MouseEventListener;
    onInput?: MouseEventListener;
    onKeyPress?: MouseEventListener;
    placeholder?: string;
    required?: boolean;
    type?: InputType;
    value?: boolean | number | string;
}

export enum InputType {
    Checkbox = 'checkbox',
    Email = 'email',
    Hidden = 'hidden',
    Number = 'number',
    Radio = 'radio',
    Submit = 'submit',
    Text = 'text'
}

export const TestInput = component<InputProps>(
    (
        html,
        {
            autocomplete = false,
            className,
            disabled,
            max,
            min,
            name,
            onChange,
            onInput,
            onKeyPress,
            placeholder = '',
            required = false,
            type = InputType.Text,
            value
        }
    ) => {
        const numAttribute = (value?: number | string) => {
            const res = type === InputType.Number && (value ?? undefined);
            return res;
        };

        return html`
            <input
                $change=${onChange}
                $input=${onInput}
                $keypress=${onKeyPress}
                autocomplete=${autocomplete}
                class=${className}
                disabled=${disabled}
                id=${name}
                max=${numAttribute(max)}
                min=${numAttribute(min)}
                name=${name}
                placeholder=${placeholder}
                required=${required}
                type=${type}
                value=${value}
            />
        `;
    }
);
