import type { FrameworkResult } from '@loom-js/bench';
import { el, type SimpleComponent } from '@loom-js/core';
import { PinkTable } from '@loom-js/pink';
import classNames from 'classnames';

import { formatRatio, ratio, ratioShade } from '../lib/compare';
import styles from '../styles.module.css';

export type MetricTableProps = {
    frameworks: FrameworkResult[];
    baseline: FrameworkResult;
    /** The column heading for the value. */
    label: string;
    read: (framework: FrameworkResult) => number;
    format: (value: number) => string;
};

/** Framework / value / ratio-to-baseline, for the single-number metrics. */
export const MetricTable: SimpleComponent<MetricTableProps> = ({
    baseline,
    format,
    frameworks,
    label,
    read
}) =>
    PinkTable.Wrapper({
        className: styles.tableWrapper,
        children: PinkTable({
            isTableLayoutAuto: true,
            children: [
                PinkTable.Head({
                    children: PinkTable.Row({
                        children: [
                            PinkTable.HeadCol({ children: 'Framework' }),
                            PinkTable.HeadCol({
                                className: styles.numeric,
                                children: label
                            }),
                            PinkTable.HeadCol({
                                className: styles.numeric,
                                children: 'vs vanilla'
                            })
                        ]
                    })
                }),
                PinkTable.Body({
                    children: frameworks.map((framework) => {
                        const relative = ratio(read(framework), read(baseline));

                        return PinkTable.Row({
                            children: [
                                PinkTable.Col({ children: framework.name }),
                                PinkTable.Col({
                                    className: styles.numeric,
                                    children: format(read(framework))
                                }),
                                PinkTable.Col({
                                    className: classNames(
                                        styles.numeric,
                                        styles.shaded
                                    ),
                                    style: {
                                        '--shade': String(ratioShade(relative))
                                    },
                                    children: el('span')({
                                        children: formatRatio(relative)
                                    })
                                })
                            ]
                        });
                    })
                })
            ]
        })
    });
