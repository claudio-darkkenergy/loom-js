// The svelte 5 implementation: one component, runes, keyed each.
import { mount } from 'svelte';

import { markReady } from '../../shared';
import Bench from './Bench.svelte';

mount(Bench, { target: document.getElementById('app') as HTMLElement });
markReady();
