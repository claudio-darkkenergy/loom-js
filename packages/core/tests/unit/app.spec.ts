import { expect } from '@esm-bundle/chai';
import { runSetup } from '../support/run-setup';

let $test: HTMLElement;
const appClassName = 'app-test';
const testId = Math.round(Math.random() * 1000);
const testText = 'Testing `app`...';
const containerClassName = `${appClassName}-${testId}`;

describe('app', () => {
    before(async () => {
        $test = await runSetup({
            containerProps: {
                className: containerClassName,
                componentProps: {
                    value: testText
                }
            }
        });
    });

    it('attached the container app w/ classname', () => {
        expect($test.children[0].className).to.equal(containerClassName);
        expect($test.id).to.equal('loom-app');
    });

    it('has the right `textContent` value', () => {
        expect($test.textContent?.trim()).to.equal(testText.trim());
    });
});
