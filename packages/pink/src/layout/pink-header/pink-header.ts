import {
    ComponentProps,
    ContextFunction,
    PlainObject,
    type Component,
    type SimpleComponent,
    type TemplateTagValue
} from '@loom-js/core';
import { Header } from '@loom-js/tags';
import classNames, { Argument } from 'classnames';

export interface PinkHeaderColsProp {
    gridCol1: ContextFunction | TemplateTagValue;
    gridCol2: ContextFunction | TemplateTagValue;
    gridCol3: ContextFunction | TemplateTagValue;
    gridCol4: ContextFunction | TemplateTagValue;
}

export type PinkHeaderRenderProp = (
    cols: PinkHeaderColsProp
) => TemplateTagValue;

export interface PinkHeaderGridColProp {
    item: Component | ((props: ComponentProps) => TemplateTagValue);
    props: PlainObject;
}

export interface PinkHeaderProps {
    gridCol1?: PinkHeaderGridColProp;
    gridCol2?: PinkHeaderGridColProp;
    gridCol3?: PinkHeaderGridColProp;
    gridCol4?: PinkHeaderGridColProp;
    children: TemplateTagValue | PinkHeaderRenderProp;
}
export const PinkHeader: SimpleComponent<PinkHeaderProps> = ({
    children,
    className,
    gridCol1,
    gridCol2,
    gridCol3,
    gridCol4,
    ...headerProps
}) => {
    const mergeGridColProps = (
        gridCol: PinkHeaderGridColProp | undefined,
        col: number
    ) => {
        if (!gridCol) {
            return;
        }

        const {
            item,
            props: { className, ...colProps }
        } = gridCol;
        return item({
            ...colProps,
            className: classNames(
                className as Argument,
                `grid-header-col-${col}`
            )
        });
    };

    return Header({
        ...headerProps,
        children:
            typeof children === 'function'
                ? (children as PinkHeaderRenderProp)({
                      gridCol1: mergeGridColProps(gridCol1, 1),
                      gridCol2: mergeGridColProps(gridCol2, 2),
                      gridCol3: mergeGridColProps(gridCol3, 3),
                      gridCol4: mergeGridColProps(gridCol4, 4)
                  })
                : children,
        className: classNames(className, 'grid-header')
    });
};
