import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { config } from '../../src/config';
import { compilePlan } from '../../src/lib/templating/compile-plan';
import { createSlots } from '../../src/lib/templating/slots';

const TOKEN = config.TOKEN;

// Parses markup the way `htmlParser` does for table-free templates.
const parse = (markup: string) =>
    document.createRange().createContextualFragment(markup);

// Parses markup through a `<template>`, as table-bearing templates are.
const parseTable = (markup: string) => {
    const template = document.createElement('template');

    template.innerHTML = markup;

    return template.content;
};

const kindsOf = (fragment: DocumentFragment) =>
    compilePlan(fragment).entries.map(({ kind }) => kind);

// The nodes a fresh clone's slots land on, as tag names / text content.
const slotTargets = (fragment: DocumentFragment) => {
    const plan = compilePlan(fragment);
    const clone = document.importNode(fragment, true);

    return createSlots(plan, clone).map(({ node }) =>
        node instanceof Element
            ? node.tagName.toLowerCase()
            : `#text in ${(node as Text).parentElement?.tagName.toLowerCase() ?? 'fragment'}`
    );
};

describe('compilePlan', () => {
    afterEach(() => sinon.restore());

    describe('classification', () => {
        it('should classify every kind of dynamic attribute by name', () => {
            const { entries } = compilePlan(
                parse(
                    `<div class="${TOKEN}" $click="${TOKEN}" $attrs="${TOKEN}" $on="${TOKEN}" $props="${TOKEN}" $my-label="${TOKEN}"></div>`
                )
            );

            expect(entries.map(({ kind, name }) => [kind, name])).to.deep.equal(
                [
                    ['attr', 'class'],
                    ['event', 'click'],
                    ['attrs', 'attrs'],
                    ['on', 'on'],
                    ['props', 'props'],
                    ['custom', 'my-label']
                ]
            );
            expect(entries.at(-1)?.prop, 'camel-cased prop').to.equal(
                'myLabel'
            );
        });

        it('should keep a named special attribute ahead of the events list', () => {
            sinon.stub(config.events, 'includes').returns(true);

            expect(
                kindsOf(
                    parse(`<div $attrs="${TOKEN}" $anything="${TOKEN}"></div>`)
                )
            ).to.deep.equal(['attrs', 'event']);
        });

        it('should treat an attribute holding the encoded token as dynamic', () => {
            expect(
                kindsOf(
                    parse(`<a href="${encodeURIComponent(TOKEN)}">link</a>`)
                )
            ).to.deep.equal(['attr']);
        });

        it('should compile an empty plan for a static template', () => {
            expect(
                compilePlan(parse('<p class="static">text</p>'))
            ).to.deep.equal({ entries: [], steps: [] });
        });
    });

    describe('fragment normalization', () => {
        it('should strip special attributes and keep standard ones', () => {
            const fragment = parse(
                `<button class="${TOKEN}" $click="${TOKEN}" $props="${TOKEN}" $static="kept"></button>`
            );

            compilePlan(fragment);

            const button = fragment.firstElementChild!;

            expect(button.getAttributeNames()).to.deep.equal([
                'class',
                '$static'
            ]);
        });

        it('should split slot tokens into their own text nodes', () => {
            const fragment = parse(`<p>Hello ${TOKEN} and ${TOKEN}!</p>`);
            const { entries } = compilePlan(fragment);
            const paragraph = fragment.firstElementChild!;

            expect(
                Array.from(paragraph.childNodes).map((node) => node.textContent)
            ).to.deep.equal(['Hello ', TOKEN, ' and ', TOKEN, '!']);
            expect(entries.map(({ kind }) => kind)).to.deep.equal([
                'text',
                'text'
            ]);
        });

        it('should swap a table-content comment marker for its token text node', () => {
            const fragment = parseTable(
                `<table><tbody><!--${TOKEN}--></tbody></table>`
            );
            const { entries } = compilePlan(fragment);
            const marker = fragment.querySelector('tbody')!.firstChild!;

            expect(marker.nodeType, 'a text node').to.equal(Node.TEXT_NODE);
            expect(marker.textContent).to.equal(TOKEN);
            expect(entries.map(({ kind }) => kind)).to.deep.equal(['text']);
        });
    });

    describe('entries and steps', () => {
        it('should list entries in interpolation order, sharing a node between its attributes', () => {
            const { entries } = compilePlan(
                parse(
                    `<a href="${TOKEN}" $click="${TOKEN}">${TOKEN}</a><b>${TOKEN}</b>`
                )
            );

            expect(entries.map(({ kind, node }) => [kind, node])).to.deep.equal(
                [
                    ['attr', 0],
                    ['event', 0],
                    ['text', 1],
                    ['text', 2]
                ]
            );
        });

        it('should lead each slot of a clone to its node through descendants, siblings and parents', () => {
            expect(
                slotTargets(
                    parse(
                        `<section class="${TOKEN}"><header><h1 id="${TOKEN}">${TOKEN}</h1></header><ul><li>static</li><li class="${TOKEN}">${TOKEN} / ${TOKEN}</li></ul><footer $click="${TOKEN}"></footer></section>`
                    )
                )
            ).to.deep.equal([
                'section',
                'h1',
                '#text in h1',
                'li',
                '#text in li',
                '#text in li',
                'footer'
            ]);
        });

        it('should reach top-level tokens of a fragment-rooted template', () => {
            expect(
                slotTargets(parse(`${TOKEN}<i class="${TOKEN}"></i>${TOKEN}`))
            ).to.deep.equal(['#text in fragment', 'i', '#text in fragment']);
        });

        it('should reach table rows and cells parsed through a template', () => {
            expect(
                slotTargets(
                    parseTable(
                        `<tr class="${TOKEN}"><td>${TOKEN}</td><td><a $click="${TOKEN}">${TOKEN}</a></td></tr>`
                    )
                )
            ).to.deep.equal(['tr', '#text in td', 'a', '#text in a']);
        });
    });
});
