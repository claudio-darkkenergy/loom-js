import type { FrameworkResult } from '@loom-js/bench';
import { el, type SimpleComponent } from '@loom-js/core';

import { formatBytes } from '../lib/compare';
import styles from '../styles.module.css';

export type BundleBarsProps = {
    frameworks: FrameworkResult[];
};

/** Gzip size per framework as proportional bars; the raw size in the label. */
export const BundleBars: SimpleComponent<BundleBarsProps> = ({
    frameworks
}) => {
    const largest = Math.max(
        ...frameworks.map(({ bundle }) => bundle.gzipBytes)
    );

    return el('ul')({
        className: styles.bars,
        children: frameworks.flatMap((framework) => [
            el('li')({ children: framework.name }),
            el('li')({
                className: styles.barTrack,
                children: el('div')({
                    className: styles.bar,
                    attrs: {
                        'aria-label': `${framework.name}: ${formatBytes(framework.bundle.gzipBytes)} gzip`
                    },
                    style: {
                        '--share': String(framework.bundle.gzipBytes / largest)
                    }
                })
            }),
            el('li')({
                className: styles.barLabel,
                children: `${formatBytes(framework.bundle.gzipBytes)} gzip · ${formatBytes(framework.bundle.bytes)} raw`
            })
        ])
    });
};
