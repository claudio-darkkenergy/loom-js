import * as Chai from 'chai';
import intern from 'intern';
import { TddInterface } from 'intern/lib/interfaces/tdd';

export const tdd = intern['_plugins']['interface.tdd'] as TddInterface;
export const chai = intern['_plugins'].chai as typeof Chai;
