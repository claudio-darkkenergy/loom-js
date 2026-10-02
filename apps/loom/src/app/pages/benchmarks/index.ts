import { OP_IDS } from '@loom-js/bench';
import { el, type SimpleComponent, type TemplateTagValue } from '@loom-js/core';
import { PinkContainer } from '@loom-js/pink';
import classNames from 'classnames';

import { BundleBars } from './components/bundle-bars';
import { Methodology } from './components/methodology';
import { MetricTable } from './components/metric-table';
import { OpsTable } from './components/ops-table';
import { RunCaption } from './components/run-caption';
import {
    findBaseline,
    formatBytes,
    formatMs,
    orderFrameworks
} from './lib/compare';
import styles from './styles.module.css';
import { SecondaryContainer } from '@/app/components/containers/secondary-container';
import { ContentLoadError } from '@/app/components/content/content-load-error';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';
import {
    benchResults,
    isBenchFailure
} from '@/app/logic/activity/bench-results';
import { useBenchResults } from '@/app/logic/hooks';

const Section = (title: string, children: TemplateTagValue) =>
    SecondaryContainer({ title, children });

/**
 * The benchmarks page: loom against react, vue, svelte, solid and a vanilla
 * baseline, from the results the build measured. Renders a skeleton while the
 * results load on a client navigation; a prerendered load has them already.
 */
const Benchmarks: SimpleComponent = (props) => {
    useBenchResults();

    return PinkContainer({
        ...props,
        is: el('div'),
        className: classNames(styles.page, 'u-padding-32'),
        children: [
            el('h1')({
                className: 'heading-level-3',
                children: 'Benchmarks'
            }),
            benchResults.effect(({ value }) => {
                if (isBenchFailure(value)) {
                    return ContentLoadError({ message: value.benchError });
                }

                if (!value) {
                    return SkeletonLoader({
                        bones: [Bones.detailsDouble, Bones.box, Bones.boxTall]
                    });
                }

                const baseline = findBaseline(value);

                if (!baseline) {
                    return ContentLoadError({
                        message: 'The results carry no vanilla baseline.'
                    });
                }

                const frameworks = orderFrameworks(value.frameworks, OP_IDS);

                return [
                    el('div')({
                        className: classNames(
                            styles.lead,
                            'u-flex-vertical u-gap-16'
                        ),
                        children: [
                            el('p')({
                                children:
                                    'The same table app, written once per framework, driven through the same operations in the same browser on the same machine. Vanilla JavaScript is the baseline; every other number is shown with its ratio to that.'
                            }),
                            RunCaption({ results: value })
                        ]
                    }),
                    Section(
                        'DOM operations',
                        OpsTable({ baseline, frameworks })
                    ),
                    Section('Bundle size', BundleBars({ frameworks })),
                    Section(
                        'Startup',
                        MetricTable({
                            baseline,
                            format: formatMs,
                            frameworks,
                            label: 'Time to first render',
                            read: ({ startupMs }) => startupMs.median
                        })
                    ),
                    Section(
                        'Memory',
                        MetricTable({
                            baseline,
                            format: formatBytes,
                            frameworks,
                            label: 'Heap after 1,000 rows',
                            read: ({ heapBytes }) => heapBytes.median
                        })
                    ),
                    Section('Methodology', Methodology({}))
                ];
            })
        ]
    });
};

export default Benchmarks;
