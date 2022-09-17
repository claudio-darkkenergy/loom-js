import { expect } from '@esm-bundle/chai';
import { runSetup } from '../support/run-setup';

let $test: HTMLElement;
const appClassName = 'app-test';
const testId = Math.round(Math.random() * 1000);
const testText = 'Testing `app`...';

describe('app', () => {
    before(async () => {
        $test = await runSetup({
            containerProps: {
                className: `${appClassName}-${testId}`,
                componentProps: {
                    value: testText
                }
            }
        });
    });

    it('attached the container app w/ classname', () => {
        expect($test.className).to.equal(`${appClassName}-${testId}`);
    });

    it('has the right `textContent` value', () => {
        expect($test.textContent?.trim()).to.equal(testText.trim());
    });
});
