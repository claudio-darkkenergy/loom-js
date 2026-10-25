// Chrome's Performance-panel extensibility API: `performance.measure` with
// `detail.devtools` lands an entry on a custom track. Other browsers record
// a plain user-timing measure. Entries are cleared right after recording —
// the trace already holds them, and the timeline buffer must not grow.
const TRACK_GROUP = 'loom';

const measure = (
    perf: Performance,
    name: string,
    start: number,
    end: number,
    track: string,
    color: string,
    tooltipText: string
) => {
    try {
        perf.measure(name, {
            detail: {
                devtools: {
                    color,
                    dataType: 'track-entry',
                    tooltipText,
                    track,
                    trackGroup: TRACK_GROUP
                }
            },
            end,
            start
        });
        perf.clearMeasures(name);
    } catch {
        // A measure is diagnostic only — never let it break a render.
    }
};

export const createPerfTracks = (
    perf: Performance = globalThis.performance
) => ({
    // An instance render that took `ms`, ending now.
    render(name: string, ms: number) {
        const end = perf.now();

        measure(
            perf,
            name,
            end - ms,
            end,
            'Renders',
            'primary',
            `${name} rendered in ${ms.toFixed(2)}ms`
        );
    },
    // An activity commit, as an instant on its own track.
    commit(name: string) {
        const at = perf.now();

        measure(
            perf,
            `${name} commit`,
            at,
            at + 0.01,
            'Activities',
            'secondary',
            `${name} committed`
        );
    }
});

export type PerfTracks = ReturnType<typeof createPerfTracks>;
