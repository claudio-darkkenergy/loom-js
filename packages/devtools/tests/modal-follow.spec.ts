import { expect } from '@esm-bundle/chai';

import { followModalDialogs } from '../src/backend/modal-follow';

// Specs for `devtools-inspector`'s "The HUD stays usable over modal
// dialogs": the backend's nodes belong in the topmost open modal dialog,
// and back on the document element once none is open.

// Mutation observers report after a microtask.
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('devtools modal following', () => {
    let targets: Element[];
    let stop: () => void;
    const dialogs: HTMLDialogElement[] = [];
    const openDialog = () => {
        const dialog = document.createElement('dialog');

        document.body.append(dialog);
        dialogs.push(dialog);
        dialog.showModal();
        return dialog;
    };

    beforeEach(() => {
        targets = [];
        stop = followModalDialogs(document, (target) => targets.push(target));
    });

    afterEach(() => {
        stop();
        dialogs.splice(0).forEach((dialog) => dialog.remove());
    });

    it('follows the topmost modal dialog and returns when it closes', async () => {
        const outer = openDialog();

        await settle();
        const inner = openDialog();

        await settle();
        inner.close();
        await settle();
        outer.close();
        await settle();

        expect(targets).to.deep.equal([
            outer,
            inner,
            outer,
            document.documentElement
        ]);
    });

    it('ignores a dialog shown without showModal', async () => {
        const dialog = document.createElement('dialog');

        document.body.append(dialog);
        dialogs.push(dialog);
        dialog.show();
        await settle();

        expect(targets).to.deep.equal([]);
    });

    it('returns to the document when an open modal dialog is removed', async () => {
        const dialog = openDialog();

        await settle();
        dialog.remove();
        await settle();

        expect(targets).to.deep.equal([dialog, document.documentElement]);
    });
});
