import { expect } from '@esm-bundle/chai';

import {
    type DockSettings,
    clampFloat,
    readDockSettings,
    resizeFloat,
    resolveDock,
    writeDockSettings
} from '../src/backend/dock-state';

// Specs for `devtools-inspector`'s "The HUD can dock or pop out": the
// dock's position settings and the edge they resolve to.

const viewOf = (innerWidth: number, direction = 'ltr') =>
    ({
        document: { documentElement: {} },
        getComputedStyle: () => ({ direction }),
        innerHeight: 800,
        innerWidth
    }) as unknown as Window;
const settings = (overrides: Partial<DockSettings>): DockSettings => ({
    collapsed: false,
    float: { height: 480, width: 720, x: 100, y: 100 },
    floating: false,
    height: 300,
    position: 'auto',
    width: 400,
    ...overrides
});

describe('devtools dock state', () => {
    it('docks automatically at the side only while 600px of page fit beside it', () => {
        expect(resolveDock(viewOf(1000), settings({})).edge).to.equal('side');
        expect(resolveDock(viewOf(999), settings({})).edge).to.equal('bottom');
    });

    it('holds a chosen edge whatever the width', () => {
        expect(
            resolveDock(viewOf(700), settings({ position: 'side' })).edge
        ).to.equal('side');
        expect(
            resolveDock(viewOf(1600), settings({ position: 'bottom' })).edge
        ).to.equal('bottom');
    });

    it('takes the side from the page direction', () => {
        expect(resolveDock(viewOf(1200), settings({})).side).to.equal('right');
        expect(resolveDock(viewOf(1200, 'rtl'), settings({})).side).to.equal(
            'left'
        );
    });

    it('floats over the page whatever the position, until docked', () => {
        expect(
            resolveDock(viewOf(1600), settings({ floating: true })).edge
        ).to.equal('float');
        expect(
            resolveDock(
                viewOf(1600),
                settings({ floating: true, position: 'bottom' })
            ).edge
        ).to.equal('float');
    });

    it('keeps a floating window inside the viewport and at its minimum size', () => {
        expect(
            clampFloat(viewOf(1000), { height: 50, width: 50, x: 990, y: -20 })
        ).to.deep.equal({ height: 200, width: 320, x: 680, y: 0 });
        expect(
            clampFloat(viewOf(500), { height: 2000, width: 900, x: 0, y: 0 })
        ).to.deep.equal({ height: 800, width: 500, x: 0, y: 0 });
    });

    it('opens a new floating window at the bottom-right corner', () => {
        const view = {
            ...viewOf(1200),
            localStorage: { getItem: () => null }
        } as unknown as Window;

        expect(readDockSettings(view).float).to.deep.equal({
            height: 480,
            width: 720,
            x: 464,
            y: 304
        });
    });

    it('resizes a floating window from any edge, stopping at the viewport and the minimum', () => {
        const rect = { height: 400, width: 600, x: 100, y: 100 };

        expect(resizeFloat(viewOf(1000), rect, 'nw', -50, -30)).to.deep.equal({
            height: 430,
            width: 650,
            x: 50,
            y: 70
        });
        expect(resizeFloat(viewOf(1000), rect, 'e', 900, 0).width).to.equal(
            900
        );
        expect(resizeFloat(viewOf(1000), rect, 'w', 500, 0)).to.include({
            width: 320,
            x: 380
        });
        expect(resizeFloat(viewOf(1000), rect, 's', 0, 500).height).to.equal(
            700
        );
    });

    it("keeps the floating HUD's settings under their own key, apart from the dock's", () => {
        const float = { height: 300, width: 400, x: 50, y: 60 };

        try {
            writeDockSettings(window, settings({ float, floating: true }));

            const dock = JSON.parse(
                localStorage.getItem('loom-devtools:dock')!
            );

            expect(
                JSON.parse(localStorage.getItem('loom-devtools:hud')!)
            ).to.deep.equal({ float });
            expect(dock).to.not.have.any.keys('float');
            expect(dock.floating).to.be.true;
            expect(readDockSettings(window).float).to.deep.equal(float);
        } finally {
            localStorage.removeItem('loom-devtools:dock');
            localStorage.removeItem('loom-devtools:hud');
        }
    });
});
