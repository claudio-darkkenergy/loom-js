import { activity, component, el } from '@loom-js/core';
import { PinkButton } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './search.module.css';
import { docsSearchToggle } from '@/app/logic/activity/toggles';

// The chord's label for this reader's platform. Prerendered markup can't
// know it, so the hint renders empty and fills on the client after mount.
const shortcutHint = activity('');

// Client hints carry the platform where supported; the UA string is the
// fallback (`navigator.platform` is deprecated).
type NavigatorWithHints = Navigator & {
    userAgentData?: { platform: string };
};

const isApplePlatform = () => {
    const { userAgent, userAgentData } = navigator as NavigatorWithHints;

    return /Mac|iPhone|iPad|iPod/.test(userAgentData?.platform ?? userAgent);
};

/**
 * The header's search button: opens the docs search palette and shows the
 * keyboard chord that does the same.
 */
export const SearchTrigger = component((html, { className, onMounted }) => {
    onMounted(() => shortcutHint.update(isApplePlatform() ? '⌘K' : 'Ctrl K'));

    return html`
        <${PinkButton}
            attrs=${{ 'aria-label': 'Search docs' }}
            className=${classNames(styles.trigger, className)}
            icon="icon-search"
            isSecondary
            onClick=${() => docsSearchToggle.update(true)}
        >
            ${shortcutHint.effect(({ value }) =>
                el('kbd')({
                    attrs: { 'aria-hidden': true },
                    children: value,
                    className: classNames('kbd is-not-mobile', {
                        'u-hide': !value
                    })
                })
            )}
        </>
    `;
});
