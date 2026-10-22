import { defineConfig } from '@loom-js/build';

export default defineConfig({
    entry: './src/main.ts',
    html: { title: () => 'Pink + Tailwind' },
    server: { port: 1003 },
    // Written by the Tailwind CLI (`pnpm build-styles`) before loom builds.
    styles: ['./.generated/styles.css']
});
