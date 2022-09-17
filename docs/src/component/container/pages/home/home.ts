import { component, onRoute } from '@loomjs/core';
import classNames from 'classnames';

import { pageContentActivity } from '@app/activities/page-content';
import { H1, H2, Section, Span } from '@app/component/simple';
import { PageControl, SiteLogo, StyledRichText } from '@app/component/styled';
import { Themed, ThemePreset } from '@app/component/styled/themed';
import { Site } from '@app/types';

import styles from './styles.scss';

export interface HomeProps {
    site: Site;
}

export const Home = component<HomeProps>((html, { site }) => {
    const { effect: pageContentEffect } = pageContentActivity;

    return html`
        <div class=${styles.home} role="banner">
            <!-- Site Logo -->
            ${SiteLogo({
                caption: [
                    H1({ children: site.logo?.title }),
                    Span({
                        children: site.logo?.description,
                        className: styles.subtitle
                    })
                ],
                className: styles.siteLogo,
                height: 240,
                width: 240
            })}
            <!-- Tagline -->
            <p class=${styles.tagline}>${site.shortDescription}</p>
            ${pageContentEffect(({ value: { page } }) =>
                Section({
                    children: page.contentCollection?.items.map(
                        ({ description, title }) =>
                            StyledRichText({
                                json: description?.json,
                                title: title && H2({ children: title })
                            })
                    )
                })
            )}
            <!-- Page Actions -->
            <div class=${styles.pageActions}>
                ${Themed({
                    preset: ThemePreset.Ghost,
                    themable: ({ color, theme }) =>
                        PageControl({
                            children: 'Start Learning',
                            className: classNames(color, theme),
                            onClick: (e) =>
                                onRoute(e, { href: '/learn/concepts' })
                        })
                })}
            </div>
        </div>
    `;
});
