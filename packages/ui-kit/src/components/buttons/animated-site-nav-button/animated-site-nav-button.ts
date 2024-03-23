import styles from './styles.scss';
import { siteNavToggleActivity } from '@app/activities/site-nav-toggle';
import { component, onRouteUpdate } from '@loom-js/core';
import { UiSprite, UiSpriteId } from '@loom-js/tags';
import { StyledSiteNavButton } from '@loom-js/tags';
import { Transition, TransitionPhase } from '@loom-js/tags';
import classNames from 'classnames';

export const AnimatedSiteNavButton = component((html) => {
    const { update: showNav, value: navIsOpen } = siteNavToggleActivity;
    let leaveTransition: () => void | Promise<void>;

    // Call the leave transition on route updates.
    onRouteUpdate(() => leaveTransition && leaveTransition());

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
