import { routeEffect, type SimpleComponent } from '@loom-js/core';
import {
    PinkActionBar,
    PinkButton,
    PinkContainer,
    PinkContainerProps
} from '@loom-js/pink';
import classNames from 'classnames';

import { Breadcrumbs } from '@/app/components/content/breadcrumbs';
import { topicTocToggle } from '@/app/logic/activity/toggles';

export type DocContainerProps = PinkContainerProps;

/**
 * A `DocContainer` is a container element that will render a `Breadcrumbs`
 * component based on the current route. It is meant to be used as a top-level
 * element in the pages of the documentation.
 *
 * By default, it includes the `u-grid` and `u-overflow-hidden` utility classes.
 */
export const DocContainer: SimpleComponent<DocContainerProps> = ({
    children,
    className,
    ...props
}) => {
    const { update: toggleTopicToc } = topicTocToggle;
    const newChildren = [
        // 2b. Not same node
        PinkActionBar({
            className: 'u-width-full-line',
            startContent: {
                children: routeEffect(({ value: { pathname = '' } }) =>
                    Breadcrumbs({ pathname })
                )
            },
            endContent: {
                children: PinkButton({
                    buttonSize: '1.5rem',
                    className: classNames('is-not-desktop'),
                    icon: 'icon-list',
                    isOnlyIcon: true,
                    isText: true,
                    onClick: () => toggleTopicToc(null)
                })
            }
        }),
        // children: topicTocToggleEffect(({ value: topicToc }) =>
        //     PinkButton({
        //         className: classNames('is-not-desktop'),
        //         icon: 'icon-list',
        //         isOnlyIcon: true,
        //         isText: true,
        //         onClick: () => toggleTopicToc(null)
        //     })
        // )
        // }
        // })
        // 2a. Same node
        children
    ];
    console.log({ newChildren });

    // 2.Same node
    return PinkContainer({
        ...props,
        className: classNames('u-grid', className),
        children: newChildren
    });
};
