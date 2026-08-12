import {
    el,
    type ComponentInputProps,
    type SimpleComponent,
    type TemplateTagValue
} from '@loom-js/core';
import { PinkContainer } from '@loom-js/pink';

export type SecondaryContainerProps = ComponentInputProps<{
    title: TemplateTagValue;
}>;

// Forwards caller `children` — the functional form keeps arbitrary children
// values (including arrays) off the component-tag region path.
export const SecondaryContainer: SimpleComponent<SecondaryContainerProps> = ({
    children,
    title,
    ...props
}) => {
    return PinkContainer({
        ...props,
        is: el('section'),
        children: [
            el('h2')({
                children: title,
                className: 'heading-level-4 u-padding-16 u-text-center'
            }),
            children
        ]
    });
};
