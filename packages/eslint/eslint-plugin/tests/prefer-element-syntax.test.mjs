import loom from '../dist/index.js';
import { ruleTester } from './rule-tester.mjs';

ruleTester.run('prefer-element-syntax', loom.rules['prefer-element-syntax'], {
    valid: [
        // Attribute-value positions are sanctioned value positions.
        'const A = ({ html }) => html`<div is=${Chip}></div>`;',
        'const A = ({ html }) => html`<div is="${Chip}"></div>`;',
        "const A = ({ html }) => html`<div is='${Chip}'></div>`;",
        'const A = ({ html }) => html`<${Layout} header=${Header({ compact: true })}></${Layout}>`;',
        // Array items & callback returns — the interpolation is the `.map` call.
        'const A = ({ html }) => html`<ul>${items.map((item) => Chip({ label: item }))}</ul>`;',
        // Effect hooks — lowercase callee.
        'const A = ({ html }) => html`<div>${locationEffect(cb)}</div>`;',
        // Region variables — not calls at all.
        'const A = ({ html }) => html`<div>${children}</div>`;',
        'const A = ({ html }) => html`<div>${slots?.header}</div>`;',
        // Conditional expressions are non-direct — deliberately spared.
        'const A = ({ html }) => html`<div>${cond ? Chip({}) : Card({})}</div>`;',
        // Global constructor-likes.
        'const A = ({ html }) => html`<div>${String(value)}</div>`;',
        'const A = ({ html }) => html`<div>${Number(value)}</div>`;',
        // Non-loom tagged templates are ignored entirely.
        'const style = css`div { color: ${Chip({})}; }`;',
        // Untagged templates too.
        'const text = `${Chip({ label })}`;',
        // ignoreNames spares a configured capitalized helper.
        {
            code: 'const A = ({ html }) => html`<div>${Translate(key)}</div>`;',
            options: [{ ignoreNames: ['Translate'] }]
        },
        // A renamed renderer is a documented false negative by default.
        'const A = ({ render }) => render`<div>${Chip({ label })}</div>`;'
    ],
    invalid: [
        {
            code: 'const A = ({ html }) => html`<div>${Chip({ label })}</div>`;',
            errors: [
                { messageId: 'preferElementSyntax', data: { name: 'Chip' } }
            ]
        },
        {
            // Member-expression callee ending in a capitalized property.
            code: 'const A = ({ html }) => html`<div>${Pink.Chip({ label })}</div>`;',
            errors: [
                { messageId: 'preferElementSyntax', data: { name: 'Chip' } }
            ]
        },
        {
            // Root position counts as child position.
            code: 'const A = ({ html }) => html`<div>${Card({})}${Chip({})}</div>`;',
            errors: [
                { messageId: 'preferElementSyntax', data: { name: 'Card' } },
                { messageId: 'preferElementSyntax', data: { name: 'Chip' } }
            ]
        },
        {
            // Nested loom template inside another interpolation.
            code: 'const A = ({ html }) => html`<ul>${items.map((item) => html`<li>${Chip({ label: item })}</li>`)}</ul>`;',
            errors: [
                { messageId: 'preferElementSyntax', data: { name: 'Chip' } }
            ]
        },
        {
            // tagNames option widens detection to a renamed renderer.
            code: 'const A = ({ render }) => render`<div>${Chip({ label })}</div>`;',
            options: [{ tagNames: ['html', 'render'] }],
            errors: [
                { messageId: 'preferElementSyntax', data: { name: 'Chip' } }
            ]
        }
    ]
});
