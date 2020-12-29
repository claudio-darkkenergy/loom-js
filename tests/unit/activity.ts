import { afterEach, beforeEach } from 'intern/lib/interfaces/tdd';
// import * as sinon from 'sinon';
import { spy } from 'sinon';

import { Activity } from '../../src/activity';
import {
    ActivityContext,
    ActivityHandler,
    ActivityWorkers,
    TemplateTagValue
} from '../../src/types';
import { chai, tdd } from '../support/intern-interfaces';
import { randomNumber } from '../support/utils';

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Activity', () => {
    let activity: ActivityWorkers<number>;
    let initialValue: number;

    before(() => {
        initialValue = randomNumber();
        activity = Activity(initialValue);
    });

    test('should return ActivityWorkers when called', () => {
        expect(activity).to.have.all.keys(
            'defaultValue',
            'effect',
            'update',
            'value'
        );
    });

    suite('.defaultValue', () => {
        test(`should return the initial value`, () => {
            expect(activity.defaultValue).to.equal(initialValue);
        });
    });

    // suite('.effect(handler)', () => {
    //     let effectReturnValue: TemplateTagValue;
    //     let handler: ActivityHandler = () => handlerReturnValue;
    //     let handlerReturnValue: TemplateTagValue;
    //     let handlerPropsCtx: ActivityContext = {};
    //     const handlerSpy = spy(handler);

    //     before(() => {
    //         handlerReturnValue = randomNumber();
    //         effectReturnValue = activity.effect(handlerSpy);
    //     });

    //     test(`should return the handler value`, () => {
    //         expect(effectReturnValue).to.equal(handlerReturnValue);
    //     });

    //     test(`should call the handler with ActivityHandlerProps`, () => {
    //         const newValue = randomNumber();

    //         expect(handlerSpy.args[0][0].ctx).to.eql(handlerPropsCtx);
    //         expect(handlerSpy.args[0][0].value).to.eql(initialValue);
    //         activity.update(newValue);
    //         expect(handlerSpy.args[1][0].ctx).to.eql(handlerPropsCtx);
    //         expect(handlerSpy.args[1][0].value).to.eql(newValue);
    //     });
    // });

    suite(`.update(value)`, () => {
        let newValue: number;

        before(() => {
            newValue = randomNumber();
        });

        test(`should update .value`, () => {
            activity.update(newValue);
            expect(activity.value).to.equal(newValue, 'abc');
        });
    });
});
