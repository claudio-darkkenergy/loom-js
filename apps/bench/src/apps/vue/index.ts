// The vue 3 implementation: one SFC, compiled by the runner's compiler-sfc plugin.
import { createApp } from 'vue';

import { markReady } from '../../shared';
import Bench from './Bench.vue';

createApp(Bench).mount('#app');
markReady();
