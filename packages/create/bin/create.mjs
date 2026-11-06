#!/usr/bin/env node
import { nodeIo, nodeSpawn, run } from '../dist/index.mjs';

run({
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    env: process.env,
    io: nodeIo(),
    spawn: nodeSpawn
}).then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
);
