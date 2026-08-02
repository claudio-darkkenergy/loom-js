import type { ComponentInputProps, SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

import { PinkButton, type PinkButtonProps } from '../pink-button';

export type PinkButtonsListProps = Omit<UlProps, 'item'> & {
    itemProps?: ComponentInputProps<PinkButtonProps>[];
};

export const PinkButtonsList: SimpleComponent<PinkButtonsListProps> = ({
    className,
    itemProps,
    listItemProps,
    ...ulProps
}) =>
    Ul({
        ...ulProps,
        className: classNames(className, 'buttons-list'),
        item: (buttonProps: PinkButtonProps) => PinkButton({ ...buttonProps }),
        itemProps,
        listItemProps: {
            ...listItemProps,
            className: classNames(listItemProps?.className, 'buttons-list-item')
        }
    });
