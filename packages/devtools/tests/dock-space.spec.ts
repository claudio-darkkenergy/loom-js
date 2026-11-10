import { expect } from '@esm-bundle/chai';

import { type DockSpace, createDockSpace } from '../src/backend/dock-space';

// Specs for `devtools-inspector`'s "The dock leaves the page usable": the
// page's last content, and the last content of inner scroll areas the dock
// covers, can scroll clear of a dock of the reserved height.

const DOCK = 200;

const element = (tag: string, style: Partial<CSSStyleDeclaration>) => {
    const created = document.createElement(tag);

    Object.assign(created.style, style);
    return created;
};

describe('devtools dock space', () => {
    let space: DockSpace;
    let added: Element[] = [];
    const add = (node: Element) => {
        document.body.append(node);
        added.push(node);
        return node as HTMLElement;
    };

    beforeEach(() => {
        space = createDockSpace(window, () => []);
    });

    afterEach(() => {
        space.release();
        added.forEach((node) => node.remove());
        added = [];
        document.documentElement.style.height = '';
        document.body.style.height = '';
        scrollTo(0, 0);
    });

    it('scrolls the last content clear even when html and body are viewport-high', () => {
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';

        const last = add(element('div', { height: '3000px' }));

        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });
        scrollTo(0, document.scrollingElement!.scrollHeight);

        expect(last.getBoundingClientRect().bottom).to.be.at.most(
            innerHeight - DOCK + 1
        );
    });

    it('pads a covered scroll area until release, then restores it', () => {
        const nav = add(
            element('nav', {
                bottom: '0',
                boxSizing: 'border-box',
                height: '300px',
                left: '0',
                overflowY: 'auto',
                paddingBottom: '5px',
                position: 'fixed',
                width: '200px'
            })
        );
        const item = nav.appendChild(element('div', { height: '900px' }));

        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });
        nav.scrollTop = nav.scrollHeight;

        expect(item.getBoundingClientRect().bottom).to.be.at.most(
            innerHeight - DOCK + 1
        );

        space.release();
        expect(nav.style.paddingBottom).to.equal('5px');
    });

    it('pads a covered scroll area whose content fits, so it can scroll clear', () => {
        const nav = add(
            element('nav', {
                bottom: '0',
                boxSizing: 'border-box',
                height: '300px',
                left: '0',
                overflowY: 'auto',
                position: 'fixed',
                width: '200px'
            })
        );
        const item = nav.appendChild(element('div', { height: '300px' }));

        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });
        nav.scrollTop = nav.scrollHeight;

        expect(item.getBoundingClientRect().bottom).to.be.at.most(
            innerHeight - DOCK + 1
        );
    });

    it('leaves a content-sized scroll area alone', () => {
        const block = add(
            element('pre', {
                left: '0',
                margin: '0',
                overflowY: 'auto',
                position: 'absolute',
                top: `${innerHeight - DOCK - 50}px`,
                width: '200px'
            })
        );

        block.textContent = 'line\n'.repeat(10);

        const height = block.getBoundingClientRect().height;

        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });
        expect(block.getBoundingClientRect().height).to.equal(height);
        expect(block.style.paddingBottom).to.equal('');
    });

    it('lifts a bar fixed to the bottom above the dock, and back on release', () => {
        const bar = add(
            element('div', {
                bottom: '0',
                height: '40px',
                left: '0',
                position: 'fixed',
                width: '100%'
            })
        );

        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });
        expect(bar.getBoundingClientRect().bottom).to.be.at.most(
            innerHeight - DOCK + 1
        );

        space.release();
        expect(bar.getBoundingClientRect().bottom).to.equal(innerHeight);
        expect(bar.style.translate).to.equal('');
    });

    it('narrows flowing content and a full-width fixed header beside a side dock', () => {
        const header = add(
            element('header', {
                height: '40px',
                left: '0',
                position: 'fixed',
                right: '0',
                top: '0'
            })
        );
        const column = add(element('p', { margin: '0' }));
        const dockLeft = document.documentElement.clientWidth - DOCK;

        column.textContent = 'text '.repeat(400);
        space.reserve({ edge: 'side', side: 'right', size: DOCK });

        expect(header.getBoundingClientRect().right).to.be.at.most(
            dockLeft + 1
        );
        expect(column.getBoundingClientRect().right).to.be.at.most(
            dockLeft + 1
        );

        space.release();
        expect(header.style.width).to.equal('');
        expect(document.documentElement.style.paddingRight).to.equal('');
    });

    it('shifts a floating button beside a left-hand side dock', () => {
        const button = add(
            element('button', {
                bottom: '10px',
                left: '10px',
                position: 'fixed',
                width: '60px'
            })
        );

        space.reserve({ edge: 'side', side: 'left', size: DOCK });
        expect(button.getBoundingClientRect().left).to.be.at.least(DOCK - 1);
    });

    it('leaves scroll areas above the dock alone', () => {
        const panel = add(
            element('div', {
                height: '100px',
                left: '0',
                overflowY: 'auto',
                position: 'fixed',
                top: '0',
                width: '200px'
            })
        );

        panel.append(element('div', { height: '400px' }));
        space.reserve({ edge: 'bottom', side: 'right', size: DOCK });

        expect(panel.style.paddingBottom).to.equal('');
    });
});
