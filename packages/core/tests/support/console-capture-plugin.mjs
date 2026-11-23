// Records the browser's own console output for a spec's page — messages the
// engine logs itself (attribute parse errors), which page script can't see.
// Specs drive it with `executeServerCommand` from `@web/test-runner-commands`.
export const CONSOLE_CAPTURE_START = 'console-capture-start';
export const CONSOLE_CAPTURE_STOP = 'console-capture-stop';

const captures = new Map();

export const consoleCapturePlugin = () => ({
    name: 'loom-console-capture',
    async executeCommand({ command, session }) {
        if (command === CONSOLE_CAPTURE_START) {
            const page = session.browser.getPage(session.id);
            const messages = [];
            const listener = (message) =>
                messages.push({ text: message.text(), type: message.type() });

            page.on('console', listener);
            captures.set(session.id, { listener, messages, page });

            return true;
        }

        if (command === CONSOLE_CAPTURE_STOP) {
            const capture = captures.get(session.id);

            if (!capture) {
                return [];
            }

            // A round trip flushes log entries the page sent before it.
            await capture.page.evaluate(() => 0);
            capture.page.off('console', capture.listener);
            captures.delete(session.id);

            return capture.messages;
        }
    }
});
