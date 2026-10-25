// The frontend's protocol client: says hello (and keeps saying it until a
// backend answers — after a page reload too), correlates requests with
// responses, and fans events out to listeners.
import { createTransport, envelope } from '../protocol/transport';
import {
    type Envelope,
    type Events,
    type EventType,
    type HelloResponse,
    PROTOCOL_VERSION,
    type ProtocolError,
    type Requests,
    type RequestType
} from '../protocol/types';

const HELLO_RETRY_MS = 500;

export class ClientError extends Error {
    constructor(readonly error: ProtocolError) {
        super(error.message);
    }
}

type Listener<Type extends EventType> = (payload: Events[Type]) => void;

export const createClient = (view: Window, peer: Window) => {
    const transport = createTransport(view);
    const pending = new Map<
        number,
        { reject(error: Error): void; resolve(payload: unknown): void }
    >();
    const listeners = new Map<EventType, Set<Listener<any>>>();
    const connectedListeners = new Set<(hello: HelloResponse) => void>();
    const disconnectedListeners = new Set<(error?: ProtocolError) => void>();
    let session: string | undefined;
    let nextId = 0;
    let helloTimer: ReturnType<typeof setTimeout> | undefined;

    const send = (type: string, payload: unknown, id: number) =>
        transport.post(
            peer,
            envelope({
                id,
                kind: 'request',
                payload,
                session: session ?? '',
                type
            })
        );

    const disconnect = (error?: ProtocolError) => {
        const wasConnected = session !== undefined;

        session = undefined;
        pending.forEach(({ reject }) => reject(new Error('disconnected')));
        pending.clear();
        disconnectedListeners.forEach((listener) => listener(error));
        // A version conflict won't resolve by retrying.
        wasConnected && error?.code !== 'protocol-mismatch' && connect();
    };

    const receive = (message: Envelope) => {
        if (message.kind === 'response' && message.id !== undefined) {
            const waiter = pending.get(message.id);

            pending.delete(message.id);
            message.error
                ? waiter?.reject(new ClientError(message.error))
                : waiter?.resolve(message.payload);
            return;
        }

        if (message.kind !== 'event' || message.session !== session) {
            return;
        }

        message.type === 'goodbye'
            ? disconnect()
            : listeners
                  .get(message.type as EventType)
                  ?.forEach((listener) => listener(message.payload));
    };

    transport.listen(
        (source) => source === peer,
        (message) => {
            // A message from another session means the page reloaded.
            session !== undefined &&
            message.session !== session &&
            message.type !== 'hello'
                ? disconnect()
                : receive(message);
        }
    );

    const request = <Type extends RequestType>(
        type: Type,
        payload?: Requests[Type][0]
    ) =>
        new Promise<Requests[Type][1]>((resolve, reject) => {
            const id = ++nextId;

            pending.set(id, {
                reject,
                resolve: resolve as (payload: unknown) => void
            });
            send(type, payload, id);
        });

    // Says hello until a backend answers; a refused version stops trying.
    // Only the latest hello stays pending, and only the first answer counts.
    const connect = () => {
        let lastHelloId: number | undefined;

        clearTimeout(helloTimer);

        const attempt = () => {
            const id = ++nextId;

            lastHelloId !== undefined && pending.delete(lastHelloId);
            lastHelloId = id;
            pending.set(id, {
                reject: (error) => {
                    if (error instanceof ClientError) {
                        clearTimeout(helloTimer);
                        disconnectedListeners.forEach((listener) =>
                            listener(error.error)
                        );
                    }
                },
                resolve: (payload) => {
                    const hello = payload as HelloResponse;

                    if (session === undefined) {
                        clearTimeout(helloTimer);
                        session = hello.session;
                        connectedListeners.forEach((listener) =>
                            listener(hello)
                        );
                    }
                }
            });
            send('hello', { protocol: PROTOCOL_VERSION }, id);
            helloTimer = setTimeout(attempt, HELLO_RETRY_MS);
        };

        attempt();
    };

    return {
        connect,
        on<Type extends EventType>(type: Type, listener: Listener<Type>) {
            const set = listeners.get(type) ?? new Set();

            set.add(listener);
            listeners.set(type, set);
        },
        onConnected(listener: (hello: HelloResponse) => void) {
            connectedListeners.add(listener);
        },
        onDisconnected(listener: (error?: ProtocolError) => void) {
            disconnectedListeners.add(listener);
        },
        request
    };
};

export type Client = ReturnType<typeof createClient>;
