import {
    Envelope,
    PROTOCOL_SOURCE,
    PROTOCOL_VERSION,
    type MessageKind,
    type ProtocolError
} from './types';

/** Whether a value is a devtools protocol envelope. */
export const isEnvelope = (data: unknown): data is Envelope =>
    typeof data === 'object' &&
    data !== null &&
    (data as Envelope).source === PROTOCOL_SOURCE &&
    typeof (data as Envelope).type === 'string';

/**
 * Builds one envelope.
 * @param fields The message's kind, type, session and optional parts.
 */
export const envelope = <Payload>(fields: {
    error?: ProtocolError;
    id?: number;
    kind: MessageKind;
    payload?: Payload;
    session: string;
    type: string;
}): Envelope<Payload> => ({
    ...fields,
    protocol: PROTOCOL_VERSION,
    source: PROTOCOL_SOURCE
});

export interface Transport {
    post(target: Window, message: Envelope): void;
    // Calls `onMessage` for envelopes from same-origin windows `isPeer`
    // accepts; returns the unsubscriber.
    listen(
        isPeer: (source: Window) => boolean,
        onMessage: (message: Envelope, source: Window) => void
    ): () => void;
}

/**
 * The `postMessage` transport for one window: posts with this window's
 * origin as the target, and accepts only same-origin envelopes from peers.
 * Uses `self.origin`, which an `about:srcdoc` / `about:blank` document
 * inherits — its `location.origin` reads `"null"`.
 * @param self The window the transport runs in.
 */
export const createTransport = (self: Window): Transport => ({
    listen(isPeer, onMessage) {
        const receive = ({ data, origin, source }: MessageEvent) => {
            source &&
                origin === self.origin &&
                isEnvelope(data) &&
                isPeer(source as Window) &&
                onMessage(data, source as Window);
        };

        self.addEventListener('message', receive);

        return () => self.removeEventListener('message', receive);
    },
    post(target, message) {
        target.postMessage(message, self.origin);
    }
});
