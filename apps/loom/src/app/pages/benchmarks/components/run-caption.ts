import type { BenchResults } from '@loom-js/bench';
import { el, type SimpleComponent } from '@loom-js/core';

import { formatDate } from '../lib/compare';
import styles from '../styles.module.css';

export type RunCaptionProps = {
    results: BenchResults;
};

const RUNNER_LABELS: Record<BenchResults['environment']['runner'], string> = {
    github: 'GitHub Actions runner',
    local: 'developer machine',
    vercel: 'Vercel build machine'
};

/** Where, when and on what the numbers were measured. */
export const RunCaption: SimpleComponent<RunCaptionProps> = ({ results }) => {
    const { environment, frameworks, generatedDate } = results;
    const entries: Array<[string, string]> = [
        ['Measured', formatDate(generatedDate)],
        [
            'Machine',
            `${environment.cpuModel}, ${environment.cpus} cores, ${environment.memoryGb} GB (${RUNNER_LABELS[environment.runner]})`
        ],
        ['Browser', environment.chrome],
        [
            'Versions',
            frameworks
                .filter(({ version }) => version)
                .map(({ name, version }) => `${name} ${version}`)
                .join(' · ')
        ]
    ];

    return el('div')({
        className: styles.caption,
        children: el('dl')({
            children: entries.flatMap(([term, detail]) => [
                el('dt')({ children: term }),
                el('dd')({ children: detail })
            ])
        })
    });
};
