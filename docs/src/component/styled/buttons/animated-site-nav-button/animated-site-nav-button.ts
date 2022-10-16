import { component, onRouteUpdate } from '@loom-js/core';
import classNames from 'classnames';

import { siteNavToggleActivity } from '@app/activities/site-nav-toggle';
import {
    Transition,
    TransitionPhase
} from '@app/component/behavior/transition';
import { UiSprite, UiSpriteId } from '@app/component/simple';
import { StyledSiteNavButton } from '@app/component/styled';

import styles from './styles.scss';

export const AnimatedSiteNavButton = component((html, { onUnmounted }) => {
    const { update: showNav, value: navIsOpen } = siteNavToggleActivity;
    let leaveTransition: () => void | Promise<void>;
    // Call the leave transition on route updates.
    const unsubRouteUpdate = onRouteUpdate(
        () => leaveTransition && leaveTransition()
    );

    // Do cleanup.
    onUnmounted(() => unsubRouteUpdate());

    return html`
        <template>
            ${Transition({
                animation: ({ leave, phase, toggle }) => {
                    const phaseIsEnter = phase === TransitionPhase.enter;

                    // Pass this up for route updates, where we want to trigger this transition.
                    leaveTransition = leave;

                    return StyledSiteNavButton({
                        children: [
                            UiSprite({
                                className: styles.openIcon,
                                svgId: UiSpriteId.MenuOpen
                            }),
                            UiSprite({
                                className: styles.closeIcon,
                                svgId: UiSpriteId.X
                            })
                        ],
                        className: classNames(styles.animatedSiteNavButton, {
                            [styles.enter]: phaseIsEnter,
                            [styles.leave]: !phaseIsEnter
                        }),
                        onClick: () => {
                            toggle();
                            showNav(!navIsOpen());
                        }
                    });
                }
            })}
        </template>
    `;
});
