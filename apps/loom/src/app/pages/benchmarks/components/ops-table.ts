import { OP_IDS, type FrameworkResult } from '@loom-js/bench';
import { el, type SimpleComponent } from '@loom-js/core';
import { PinkTable } from '@loom-js/pink';
import classNames from 'classnames';

import { OP_LABELS } from '../constants';
import {
    formatMs,
    formatRatio,
    ratio,
    ratioShade,
    slowdown
} from '../lib/compare';
import styles from '../styles.module.css';

export type OpsTableProps = {
    /** Column order — the baseline first (see `orderFrameworks`). */
    frameworks: FrameworkResult[];
    baseline: FrameworkResult;
};

const FrameworkHeading = ({ name, version }: FrameworkResult) =>
    PinkTable.HeadCol({
        className: styles.numeric,
        children: [
            name,
            version
                ? el('span')({ className: styles.versions, children: version })
                : undefined
        ]
    });

const ValueCell = (value: string, relative: number) =>
    PinkTable.Col({
        className: classNames(styles.numeric, styles.shaded),
        style: { '--shade': String(ratioShade(relative)) },
        children: [
            value,
            el('span')({
                className: styles.ratio,
                children: formatRatio(relative)
            })
        ]
    });

/**
 * One row per DOM operation, one column per framework: the median in ms
 * and its ratio to the baseline, shaded by that ratio. The last row is each
 * framework's geometric mean ratio across every op.
 */
export const OpsTable: SimpleComponent<OpsTableProps> = ({
    baseline,
    frameworks
}) =>
    PinkTable.Wrapper({
        className: styles.tableWrapper,
        children: PinkTable({
            isTableLayoutAuto: true,
            children: [
                PinkTable.Head({
                    children: PinkTable.Row({
                        children: [
                            PinkTable.HeadCol({ children: 'Operation' }),
                            ...frameworks.map(FrameworkHeading)
                        ]
                    })
                }),
                PinkTable.Body({
                    children: [
                        ...OP_IDS.map((opId) =>
                            PinkTable.Row({
                                children: [
                                    PinkTable.Col({
                                        children: OP_LABELS[opId]
                                    }),
                                    ...frameworks.map((framework) =>
                                        ValueCell(
                                            formatMs(
                                                framework.ops[opId].median
                                            ),
                                            ratio(
                                                framework.ops[opId].median,
                                                baseline.ops[opId].median
                                            )
                                        )
                                    )
                                ]
                            })
                        ),
                        PinkTable.Row({
                            className: styles.summaryRow,
                            children: [
                                PinkTable.Col({
                                    children: 'Geometric mean of ratios'
                                }),
                                ...frameworks.map((framework) => {
                                    const mean = slowdown(
                                        framework,
                                        baseline,
                                        OP_IDS
                                    );

                                    return PinkTable.Col({
                                        className: classNames(
                                            styles.numeric,
                                            styles.shaded
                                        ),
                                        style: {
                                            '--shade': String(ratioShade(mean))
                                        },
                                        children: formatRatio(mean)
                                    });
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
