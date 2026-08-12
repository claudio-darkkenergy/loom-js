import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export enum PinkStatusState {
    Complete = 'complete',
    Failed = 'failed',
    Pending = 'pending',
    Processing = 'processing',
    Warning = 'warning'
}

export type PinkStatusProps = ComponentInputProps<{
    status?: PinkStatusState;
    text?: string;
}>;

export const PinkStatus = component<PinkStatusProps>(
    (html, { attrs, className, id, on, onClick, status, style, text }) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames('u-capitalize', className, 'status', {
                [`is-${status}`]: status
            })}
            id=${id}
            style=${style}
        >
            <span class="status-icon"></span>
            <span class="text">${text !== undefined ? text : status}</span>
        </div>
    `
);
