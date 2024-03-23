import { expect } from '@esm-bundle/chai';
import { appendEvents, config, setToken } from '../../src/config';

describe('config', () => {
    // These will destructure to static (default) values, losing connectivity w/ the
    // `Config` object. Use the fully qualified name, i.e `config[property]` to access
    // current values of the `Config` object.
    const { events, TOKEN, tokenRe } = config;

    it('should have a default `TOKEN` of "⚡"', () => {
        expect(TOKEN).to.equal('⚡');
    });

    it('should have compatible `TOKEN` & token regex', () => {
        expect(tokenRe.test(TOKEN)).to.be.true;
    });

    describe('appendEvents()', () => {
        it('should return the updated events', () => {
            const eventsToAppend = ['monkey', 'bones'];

            appendEvents(eventsToAppend);
            expect(config.events).to.be.lengthOf(
                events.length + eventsToAppend.length
            );
        });

        // @TODO Add test: 'should work w/ appended event'
    });

    describe('setToken()', () => {
        let customToken = '';
        let updatedToken = '';

        before(() => {
            customToken = '%-%-%';
            updatedToken = setToken(customToken);
        });

        it('should update `TOKEN` w/ a custom token', () => {
            expect(updatedToken).to.equal(customToken);
            expect(config.TOKEN).to.equal(updatedToken);
        });

        it('should maintain compatibility of the token regex w/ `TOKEN`', () => {
            expect(config.tokenRe.test(config.TOKEN)).to.be.true;
        });
    });
});
