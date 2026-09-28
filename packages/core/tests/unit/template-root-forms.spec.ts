import { expect } from '@esm-bundle/chai';

import type {
    Component,
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
