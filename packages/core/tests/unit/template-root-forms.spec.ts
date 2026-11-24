import { expect } from '@esm-bundle/chai';

import { activity, component, hydrate } from '../../src';
import type {
    Component,
    ContextNodeGetter,
    TemplateRoot,
    TemplateRootArray
} from '../../src/types';
import type { TestComponentProps } from '../support/components/container';
import {
    CommentAndElementRoot,
    ComponentOnlyRoot,
    ElementAndTextRoot,
    LeadingTokenTextRoot,
    LoneInterpolationRoot,
    type RootFormProps,
    SiblingElementsRoot,
    SingleElementRoot
} from '../support/components/root-forms';
import { runSetup } from '../support/run-setup';

// The root form is inferred from the parsed top level: exactly one element
// (whitespace-only text ignored) is a single root, anything else a fragment.

type ReportedRoot = TemplateRoot | TemplateRootArray | undefined;

const renderRootForm = async (RootForm: Component<RootFormProps>) => {
    let reported: ReportedRoot;
    const $test = await runSetup({
        containerProps: {
            componentProps: {
                onRoot: (root: ReportedRoot) => (reported = root)
            } as TestComponentProps,
            TestComponent: RootForm as Component<TestComponentProps>
        }
    });

    return { $container: $test, reported: reported as ReportedRoot };
};
const contentOf = (root: ReportedRoot) =>
    (Array.isArray(root) ? root : []).filter(
        (node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()
    );

describe('template root forms', () => {
    describe('single root', () => {
        it('should report the element when whitespace surrounds it', async () => {
            const { $container, reported } =
                await renderRootForm(SingleElementRoot);

            expect(Array.isArray(reported)).to.be.false;
            expect(reported).to.equal(
                $container.querySelector('[data-single]')
            );
        });
    });

    describe('fragment root', () => {
        it('should report every top-level node of sibling elements', async () => {
            const { $container, reported } =
                await renderRootForm(SiblingElementsRoot);

            expect(Array.isArray(reported)).to.be.true;
            expect(contentOf(reported)).to.deep.equal([
                $container.querySelector('[data-first]'),
                $container.querySelector('[data-second]')
            ]);
        });

        it('should treat an element beside text as a fragment', async () => {
            const { $container, reported } =
                await renderRootForm(ElementAndTextRoot);
            const content = contentOf(reported);

            expect(content).to.have.lengthOf(2);
            expect(content[0]?.textContent?.trim()).to.equal('label');
            expect(content[1]).to.equal(
                $container.querySelector('[data-beside-text]')
            );
        });

        it('should treat a top-level comment as a fragment node', async () => {
            const { $container, reported } = await renderRootForm(
                CommentAndElementRoot
            );
            const content = contentOf(reported);

            expect(content).to.have.lengthOf(2);
            expect(content[0]).to.be.instanceof(Comment);
            expect(content[1]).to.equal(
                $container.querySelector('[data-beside-comment]')
            );
        });

        it('should render a lone top-level interpolation', async () => {
            const { $container, reported } = await renderRootForm(
                LoneInterpolationRoot
            );

            expect(Array.isArray(reported)).to.be.true;
            expect(contentOf(reported)).to.deep.equal([
                $container.querySelector('[data-leaf]')
            ]);
        });

        it('should render a component-only template', async () => {
            const { $container, reported } =
                await renderRootForm(ComponentOnlyRoot);

            expect(contentOf(reported)).to.deep.equal(
                Array.from($container.querySelectorAll('[data-leaf]'))
            );
            expect(contentOf(reported)).to.have.lengthOf(2);
        });
    });

    describe('fragment root tracking', () => {
        const On = component<{ text: string }>(
            (html, { text }) => html`
                <b data-on>${text}</b>
            `
        );
        const Off = component<{ text: string }>(
            (html, { text }) => html`
                <i data-off>${text}</i>
            `
        );
        const Item = component<{ text: string }>(
            (html, { text }) => html`
                <li data-item=${text}>${text}</li>
            `
        );

        it('should update in place after a top-level effect swaps its content', async () => {
            const swapped = activity(false);
            const label = activity('one');
            let effectRootNode: ContextNodeGetter | undefined;
            const EffectRoot = component<{ text: string }>(
                (html, { node, text }) => {
                    effectRootNode = node;

                    return html`
                        ${swapped.effect(({ value }) =>
                            value ? On({ text }) : Off({ text })
                        )}
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <section data-host>
                        ${label.effect(({ value }) =>
                            EffectRoot({ text: value })
                        )}
                    </section>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });

            swapped.update(true);
            label.update('two');

            const $on = $test.querySelector('[data-on]');

            expect($on?.textContent, 'swapped content re-rendered').to.equal(
                'two'
            );
            expect($test.querySelector('[data-off]')).to.be.null;
            expect(contentOf(effectRootNode?.())).to.deep.equal([$on]);
        });

        it('should follow a top-level list as it grows and shrinks', async () => {
            const texts = activity(['a']);
            let listNode: ContextNodeGetter | undefined;
            const ListRoot = component<{ texts: string[] }>(
                (html, { node, texts: listTexts }) => {
                    listNode = node;

                    return html`
                        ${listTexts.map((text) => Item({ key: text, text }))}
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <ul data-host>
                        ${texts.effect(({ value }) =>
                            ListRoot({ texts: value })
                        )}
                    </ul>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const items = () => Array.from($test.querySelectorAll('li'));

            texts.update(['a', 'b', 'c']);
            expect(items()).to.have.lengthOf(3);
            expect(contentOf(listNode?.()), 'after growing').to.deep.equal(
                items()
            );

            texts.update(['c']);
            expect(items()).to.have.lengthOf(1);
            expect(contentOf(listNode?.()), 'after shrinking').to.deep.equal(
                items()
            );
        });

        it('should carry a nested fragment change to the parent fragment', async () => {
            const swapped = activity(false);
            let parentNode: ContextNodeGetter | undefined;
            const Child = component(
                (html) => html`
                    ${swapped.effect(({ value }) =>
                        value ? On({ text: 'on' }) : Off({ text: 'off' })
                    )}
                `
            );
            const Parent = component((html, { node }) => {
                parentNode = node;

                return html`
                    <span data-lead></span>
                    ${Child()}
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <section>${Parent()}</section>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });

            swapped.update(true);

            expect(contentOf(parentNode?.())).to.deep.equal([
                $test.querySelector('[data-lead]'),
                $test.querySelector('[data-on]')
            ]);
        });

        it('should hand `onRendered` the current nodes after they change', async () => {
            const swapped = activity(false);
            const label = activity('one');
            let received: ReportedRoot;
            const EffectRoot = component<{ text: string }>(
                (html, { onRendered, text }) => {
                    onRendered((root) => (received = root));

                    return html`
                        ${swapped.effect(({ value }) =>
                            value ? On({ text }) : Off({ text })
                        )}
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <section>
                        ${label.effect(({ value }) =>
                            EffectRoot({ text: value })
                        )}
                    </section>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });

            swapped.update(true);
            label.update('two');

            expect(contentOf(received)).to.deep.equal([
                $test.querySelector('[data-on]')
            ]);
        });

        it('should update a hydrating fragment in place after its effect swaps', async () => {
            const swapped = activity(false);
            const label = activity('one');
            const root = document.createElement('div');
            let release: () => void = () => {};
            const ready = new Promise<void>((resolve) => (release = resolve));
            const EffectRoot = component<{ text: string }>(
                (html, { text }) => html`
                    ${swapped.effect(({ value }) =>
                        value ? On({ text }) : Off({ text })
                    )}
                `
            );
            const App = component(
                (html) => html`
                    <div class="app">
                        ${label.effect(({ value }) =>
                            EffectRoot({ text: value })
                        )}
                    </div>
                `
            );

            root.innerHTML = '<div class="app"><i data-off>one</i></div>';
            document.body.append(root);

            const bootDone = hydrate({ app: App(), ready, root });

            swapped.update(true);
            label.update('two');
            release();
            await bootDone;

            expect(root.querySelector('[data-on]')?.textContent).to.equal(
                'two'
            );
            expect(root.querySelector('[data-off]')).to.be.null;
            root.remove();
        });
    });

    describe('no authoring token', () => {
        it('should render a leading `<>` as ordinary text', async () => {
            const { $container, reported } =
                await renderRootForm(LeadingTokenTextRoot);
            const content = contentOf(reported);

            expect(content[0]?.textContent?.trim()).to.equal('<>');
            expect(content[1]).to.equal(
                $container.querySelector('[data-after-token]')
            );
        });
    });
});
