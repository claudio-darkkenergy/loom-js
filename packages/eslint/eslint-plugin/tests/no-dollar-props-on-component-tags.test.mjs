import loom from '../dist/index.js';
import { ruleTester } from './rule-tester.mjs';

ruleTester.run(
    'no-dollar-props-on-component-tags',
    loom.rules['no-dollar-props-on-component-tags'],
    {
        valid: [
            // `$` attributes on plain elements are the supported element form.
            'const A = ({ html }) => html`<button $click=${handler}>Go</button>`;',
            'const A = ({ html }) => html`<div $attrs=${attrs}></div>`;',
            // Component tags without `$` props.
            'const A = ({ html }) => html`<${Button} onClick=${handler} label="Go"></${Button}>`;',
            'const A = ({ html }) => html`<${Button} label="a > b" onClick=${handler} />`;',
            // A plain element after a closed component tag stays legal.
            'const A = ({ html }) => html`<${Card}><button $click=${handler}>Go</button></${Card}>`;',
            // `$` inside a quoted attribute value is not an attribute name.
            'const A = ({ html }) => html`<${Button} label="costs $5"></${Button}>`;',
            // Interpolated tag that is not component-shaped.
            'const A = ({ html }) => html`<${tagName} $click=${handler}></${tagName}>`;',
            // Non-loom tagged templates are ignored.
            'const style = css`<${Button} $click=${handler}>`;'
        ],
        invalid: [
            {
                code: 'const A = ({ html }) => html`<${Button} $click=${handler}>Go</${Button}>`;',
                errors: [
                    { messageId: 'noDollarProps', data: { name: '$click' } }
                ]
            },
            {
                // Multiple $ props on one tag, across interpolation boundaries.
                code: 'const A = ({ html }) => html`<${Button} $click=${handler} label=${label} $attrs=${attrs}></${Button}>`;',
                errors: [
                    { messageId: 'noDollarProps', data: { name: '$click' } },
                    { messageId: 'noDollarProps', data: { name: '$attrs' } }
                ]
            },
            {
                // Self-closing component tag.
                code: 'const A = ({ html }) => html`<${Button} $attrs=${attrs} />`;',
                errors: [
                    { messageId: 'noDollarProps', data: { name: '$attrs' } }
                ]
            },
            {
                // Member-expression component reference.
                code: 'const A = ({ html }) => html`<${Pink.Button} $click=${handler}></${Pink.Button}>`;',
                errors: [
                    { messageId: 'noDollarProps', data: { name: '$click' } }
                ]
            },
            {
                // A quoted value containing `>` does not end the tag scan.
                code: 'const A = ({ html }) => html`<${Button} label="a > b" $click=${handler}></${Button}>`;',
                errors: [
                    { messageId: 'noDollarProps', data: { name: '$click' } }
                ]
            }
        ]
    }
);
