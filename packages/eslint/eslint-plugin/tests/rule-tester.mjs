import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export const ruleTester = new RuleTester();
