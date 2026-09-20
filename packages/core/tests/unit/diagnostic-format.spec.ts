import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity } from '../../src/activity';
import {
    PENDING_LIST_CAP,
    createDiagnosticSubject,
    describePending,
    describeSubject,
    formatDiagnostic
} from '../../src/lib/globals/diagnostic-format';
import { loomConsole } from '../../src/lib/globals/loom-console';
import {
    getPendingSubjects,
    trackTransformResult
} from '../../src/lib/settlement';

// Specs for the diagnostics style contract (`diagnostics-output-quality`):
// every loom console line composes badge · scope · subject · event · detail
// as an argument array — %c-styled where the console supports it, plain
// segments otherwise — built by a formatter that never wraps the bound
// native console method, so call-site attribution survives. Subjects
// resolve to their opt-in label or a stable generated tag, and the
// settlement diagnostics enumerate the labeled subjects still pending.

const nextMacrotask = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('diagnostic format (output anatomy)', () => {
    describe('segment anatomy as argument arrays', () => {
        it('should compose badge, scope, subject, event, and detail as one plain argument when unstyled', () => {
            const args = formatDiagnostic(
                {
                    detail: 'superseded by a later dispatch',
                    event: 'dropped commit',
                    scope: 'activity',
                    subject: createDiagnosticSubject('activity', 'search')
                },
                { styled: false }
            );

            expect(args).to.deep.equal([
                '[loom] activity ⟨search⟩ dropped commit — superseded by a later dispatch'
            ]);
        });

        it('should omit the subject segment when none is given', () => {
            const args = formatDiagnostic(
                { event: 'mounting', scope: 'mutations' },
                { styled: false }
            );

            expect(args).to.deep.equal(['[loom] mutations mounting']);
        });

        it('should append the remedy as the final clause', () => {
            const args = formatDiagnostic(
                {
                    detail: 'value cannot be JSON-serialized',
                    event: 'skipped a resource',
                    remedy: 'see Dehydrated state: serializability boundary',
                    scope: 'dehydrate'
                },
                { styled: false }
            );

            expect(args).to.deep.equal([
                '[loom] dehydrate skipped a resource — value cannot be JSON-serialized — see Dehydrated state: serializability boundary'
            ]);
        });
    });

    describe('capability fallback', () => {
        it('should emit %c-styled segments with one style argument per directive when styled', () => {
            const args = formatDiagnostic(
                {
                    event: 'dropped commit',
                    scope: 'activity',
                    subject: createDiagnosticSubject('activity', 'search')
                },
                { styled: true }
            );
            const [template, ...styles] = args;
            const directiveCount = (String(template).match(/%c/g) ?? []).length;

            expect(directiveCount).to.be.greaterThan(0);
            expect(styles).to.have.length(directiveCount);
            expect(String(template))
                .to.contain('[loom]')
                .and.to.contain('activity')
                .and.to.contain('⟨search⟩')
                .and.to.contain('dropped commit');
        });

        it('should fall back to plain segments with no %c directives when unstyled', () => {
            const args = formatDiagnostic(
                { event: 'mounting', scope: 'mutations' },
                { styled: false }
            );

            expect(args).to.have.length(1);
            expect(String(args[0])).to.not.contain('%c');
        });
    });

    describe('attribution is preserved', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should print through the bound native method unchanged — arguments only, no wrapper', () => {
            const warnStub = sinon.stub(globalThis.console, 'warn');
            const boundWarn = loomConsole.warn;
            const args = formatDiagnostic(
                { event: 'expired', scope: 'hydrate' },
                { styled: false }
            );

            // Still the bound native — the formatter only builds arguments.
            expect(boundWarn.name).to.match(/^bound /);

            boundWarn(...args);

            expect(warnStub.calledOnce).to.be.true;
            expect(warnStub.firstCall.args).to.deep.equal(args);
        });
    });

    describe('label and generated-tag resolution', () => {
        it('should describe a labeled subject as its label', () => {
            const subject = createDiagnosticSubject('activity', 'search');

            expect(describeSubject(subject)).to.equal('⟨search⟩');
        });

        it('should give an unlabeled subject a stable generated tag', () => {
            const subject = createDiagnosticSubject('activity');
            const tag = describeSubject(subject);

            expect(tag).to.match(/^activity#\d+$/);
            expect(describeSubject(subject)).to.equal(tag);
        });

        it('should distinguish two unlabeled subjects of the same kind', () => {
            const first = describeSubject(createDiagnosticSubject('activity'));
            const second = describeSubject(createDiagnosticSubject('activity'));

            expect(first).to.not.equal(second);
        });
    });

    describe('pending enumeration with cap', () => {
        it('should enumerate pending subjects after the count', () => {
            const description = describePending(2, [
                createDiagnosticSubject('activity', 'page-content'),
                createDiagnosticSubject('activity', 'search')
            ]);

            expect(description).to.equal(
                '2 pending — ⟨page-content⟩, ⟨search⟩'
            );
        });

        it('should cap the enumeration and count the overflow', () => {
            const subjects = Array.from(
                { length: PENDING_LIST_CAP + 3 },
                (_unused, index) =>
                    createDiagnosticSubject('activity', `subject-${index}`)
            );
            const description = describePending(subjects.length, subjects);
            const listed = (description.match(/⟨/g) ?? []).length;

            expect(listed).to.equal(PENDING_LIST_CAP);
            expect(description).to.contain('(+3 more)');
        });

        it('should fall back to the bare count with no subjects', () => {
            expect(describePending(3, [])).to.equal('3 pending');
        });
    });

    describe('settlement subject refs', () => {
        it('should record a tracked subject while pending and release it on settle', async () => {
            const subject = createDiagnosticSubject('activity', 'spec-track');
            let release = () => {};
            const pendingWork = new Promise<void>((resolve) => {
                release = resolve;
            });

            trackTransformResult(pendingWork, subject);

            expect(getPendingSubjects()).to.contain(subject);

            release();
            await nextMacrotask();

            expect(getPendingSubjects()).to.not.contain(subject);
        });

        it('should list a labeled activity`s pending transform run under its label', async () => {
            let release = () => {};
            const pendingActivity = activity<number>(0, {
                label: 'spec-pending',
                transform: async ({ update }) => {
                    await new Promise<void>((resolve) => {
                        release = resolve;
                    });
                    update(1);
                }
            });

            pendingActivity.update(1);

            expect(
                getPendingSubjects().map((subject) => describeSubject(subject))
            ).to.contain('⟨spec-pending⟩');

            release();
            await nextMacrotask();

            expect(
                getPendingSubjects().map((subject) => describeSubject(subject))
            ).to.not.contain('⟨spec-pending⟩');
        });
    });
});
