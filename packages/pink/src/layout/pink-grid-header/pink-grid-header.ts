import { PinkDynamicProps } from '../../types';
import type {
    ComponentProps,
    ContextFunction,
    SimpleComponent
} from '@loom-js/core';
import { Div, H2, Header, type HeaderProps } from '@loom-js/tags';
import classNames from 'classnames';

const GridCol1 = ({ gridCol1 = {} }: Pick<PinkGridHeaderProps, 'gridCol1'>) => {
    const {
        className: gridCol1_className,
        is: gridCol1_is = H2,
        ...gridCol1Props
    } = gridCol1;

    return gridCol1_is({
        ...gridCol1Props,
        className: classNames(gridCol1_className, 'grid-header-col-1'),
        key: 'gridCol1'
    });
};

const GridCols = ({
    gridCol2,
    gridCol3,
    gridCol4
}: Pick<PinkGridHeaderProps, 'gridCol2' | 'gridCol3' | 'gridCol4'>) =>
    [gridCol2, gridCol3, gridCol4]
        .reduce((acc, gridCol, i) => {
            if (!gridCol) {
                return acc;
            }

            const {
                className: girdColClassName,
                is = Div,
                ...gridColProps
            } = gridCol;

            acc = acc.concat(
                is({
                    ...gridColProps,
                    className: classNames(
                        girdColClassName,
                        `grid-header-col-${i + 2}`
                    ),
                    key: `gridCol${i + 2}`
                })
            );

            return acc;
        }, [] as ContextFunction[])
        .reverse();

export type PinkGridHeaderProps = Omit<HeaderProps, 'children'> & {
    gridCol1?: ComponentProps<PinkDynamicProps>;
    gridCol2?: ComponentProps<PinkDynamicProps>;
    gridCol3?: ComponentProps<PinkDynamicProps>;
    gridCol4?: ComponentProps<PinkDynamicProps>;
};
export const PinkGridHeader: SimpleComponent<PinkGridHeaderProps> = ({
    className,
    gridCol1,
    gridCol2,
    gridCol3,
    gridCol4,
    ...headerProps
}) => {
    return Header({
        ...headerProps,
        children: [
            GridCol1({ gridCol1 }),
            Div({
                children: GridCols({
                    gridCol2,
                    gridCol3,
                    gridCol4
                }),
                className: 'u-flex u-gap-16 u-contents-mobile'
            })
        ],
        className: classNames(className, 'grid-header')
    });
};
