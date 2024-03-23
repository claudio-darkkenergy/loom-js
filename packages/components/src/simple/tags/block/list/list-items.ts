import type {
    Component,
    ComponentProps,
    ContextFunction,
    SimpleComponent,
    TemplateTagValue
} from '@loom-js/core';

import { Li } from './li';

export interface ListItemsProps {
    item?: Component | ((props: any) => ContextFunction | TemplateTagValue);
    itemProps?: (ComponentProps | TemplateTagValue)[];
}

export const ListItems: SimpleComponent<ListItemsProps> = ({
    item,
    itemProps = [],
    ...listItemProps
}) =>
    itemProps.map((props) =>
        Li({
            ...listItemProps,
            children:
                typeof item === 'function'
                    ? item(props as ComponentProps)
                    : (props as TemplateTagValue)
        })
    );
