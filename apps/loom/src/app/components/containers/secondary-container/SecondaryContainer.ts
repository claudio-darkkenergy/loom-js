import type { SimpleComponent, TemplateTagValue } from '@loom-js/core';
import { PinkContainer } from '@loom-js/pink';
import { H2, Section, type SectionProps } from '@loom-js/tags';

export type SecondaryContainerProps = SectionProps & {
    title: TemplateTagValue;
};

export const SecondaryContainer: SimpleComponent<SecondaryContainerProps> = ({
    children,
    title,
    ...props
}) => {
    return PinkContainer({
        ...props,
        is: Section,
        children: [
            H2({
                children: title,
                className: 'heading-level-4 u-padding-16 u-text-center'
            }),
            children
        ]
    });
};
