// Shared test doubles: a scripted `Io` and a recording `Spawn`.
export const scriptedIo = ({ interactive = false, answers = [] } = {}) => {
    const queue = [...answers];
    const io = {
        asked: [],
        close: () => {},
        error: (text) => io.errors.push(text),
        errors: [],
        interactive,
        printed: [],
        print: (text) => io.printed.push(text),
        ask: async (question) => {
            io.asked.push(question);

            if (queue.length === 0) {
                throw new Error(`unexpected prompt: ${question}`);
            }

            return queue.shift();
        }
    };

    return io;
};

export const recordingSpawn = (respond = () => ({ code: 0 })) => {
    const calls = [];
    const spawn = async (command, args, options) => {
        calls.push({ args, command, options });

        return { stderr: '', stdout: '', ...respond(command, args, options) };
    };

    return { calls, spawn };
};
