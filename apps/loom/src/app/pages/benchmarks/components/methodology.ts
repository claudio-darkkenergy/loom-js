import { el, type SimpleComponent } from '@loom-js/core';

import { BENCH_SOURCE_URL } from '../constants';
import styles from '../styles.module.css';

/** How the numbers are produced and what they leave out. */
export const Methodology: SimpleComponent = () =>
    el('div')({
        className: styles.method,
        children: [
            el('p')({
                children:
                    'Each framework renders the same app: a toolbar and a table of 1,000 keyed rows with identical, seeded labels. The implementations are written the way each framework documents — keyed lists, memoized rows where the framework offers them — with no DOM work outside the framework.'
            }),
            el('p')({
                children:
                    'A headless Chrome runner clicks the same buttons a user would. Each operation is timed in the page from just before the click until a forced synchronous layout after the microtask queue drains, so the number covers script, style and layout and excludes paint. Every operation runs 5 untimed warmups and 15 timed samples per framework, in round-robin order across the frameworks on a fresh page per operation; the table shows the median.'
            }),
            el('p')({
                children:
                    'Startup is the time from navigation start to the frame after the app mounts, over 10 cold loads. Memory is the JavaScript heap after rendering 1,000 rows and a forced garbage collection. Bundle size is the minified JavaScript each app ships, raw and gzipped; the shared stylesheet is excluded.'
            }),
            el('p')({
                children:
                    'The numbers are remeasured when a framework version or loom itself changes, on the machine named above. Absolute times move with the hardware; the ratios to vanilla JavaScript are the comparable part.'
            }),
            el('p')({
                children: [
                    'The bench app, runner and results schema are in the repository: ',
                    el('a')({
                        attrs: {
                            href: BENCH_SOURCE_URL,
                            rel: 'noopener',
                            target: '_blank'
                        },
                        children: 'apps/bench'
                    }),
                    '.'
                ]
            })
        ]
    });
