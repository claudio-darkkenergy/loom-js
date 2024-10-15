import type { SimpleComponent } from '@loom-js/core';
import { Div, Span, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

export enum PinkStatusState {
    Complete = 'complete',
    Failed = 'failed',
    Pending = 'pending',
    Processing = 'processing',
    Warning = 'warning'
}

export type PinkStatusProps = Omit<DivProps, 'children'> & {
    status?: PinkStatusState;
    text?: string;
};

export const PinkStatus: SimpleComponent<PinkStatusProps> = ({
    className,
    status,
    text,
    ...props
}) =>
    Div({
        ...props,
        children: [
            Span({
                className: 'status-icon'
            }),
            Span({
                className: 'text',
                children: text !== undefined ? text : status
            })
        ],
        className: classNames('u-capitalize', className, 'status', {
            [`is-${status}`]: status
        })
    });
