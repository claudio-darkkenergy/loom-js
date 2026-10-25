// The devtools protocol: every message between the in-page backend and a
// frontend (docked frame or popup window). JSON-safe throughout, so a relay
// (e.g. a future browser extension) can carry it unchanged.

export const PROTOCOL_SOURCE = 'loom-devtools';
export const PROTOCOL_VERSION = 1;

export type MessageKind = 'event' | 'request' | 'response';

export type ErrorCode =
    | 'invalid-value'
    | 'not-connected'
    | 'not-editable'
    | 'protocol-mismatch'
    | 'unknown-id'
    | 'unknown-type';

export interface ProtocolError {
    code: ErrorCode;
    message: string;
}

export interface Envelope<Payload = unknown> {
    error?: ProtocolError;
    id?: number;
    kind: MessageKind;
    payload?: Payload;
    protocol: number;
    session: string;
    source: typeof PROTOCOL_SOURCE;
    type: string;
}

/** An inspected value as a tagged descriptor (see `encodeValue`). */
export type Encoded =
    | { t: 'circular' | 'null' | 'promise' | 'undefined' | 'unserializable' }
    | { t: 'bool'; v: boolean }
    | { t: 'num'; v: number | '-0' | '-Infinity' | 'Infinity' | 'NaN' }
    | { length?: number; t: 'str'; v: string }
    | { t: 'bigint' | 'date' | 'symbol'; v: string }
    | { name: string; t: 'fn' }
    | { message: string; name: string; t: 'error' }
    | { items?: Encoded[]; length: number; t: 'array' }
    | {
          ctor?: string;
          entries?: [string, Encoded][];
          size: number;
          t: 'object';
      }
    | { entries?: [Encoded, Encoded][]; size: number; t: 'map' | 'set' }
    | { id?: number; t: 'node'; tag: string }
    | { id: number; name: string; t: 'activity' }
    | { name: string; t: 'component' };

/** A key into an inspected value: an object key or a collection index. */
export type PathKey = number | string;

export type NodeKind = 'component' | 'effect';

export interface TreeNode {
    childIds: number[];
    id: number;
    key?: number | string;
    kind: NodeKind;
    name: string;
    parentId?: number;
}

export interface ActivityRef {
    id: number;
    name: string;
}

export interface ActivityRecord extends ActivityRef {
    editable: boolean;
    pending: boolean;
    subscriberIds: number[];
    value: Encoded;
}

export interface NodeDetails {
    activities: ActivityRecord[];
    kind: NodeKind;
    lifeCycle: string | null;
    name: string;
    owned: Encoded;
    props: Encoded;
    refs: number;
}

export type Topic = 'activities' | 'flash' | 'perf' | 'renders' | 'tree';

export type Placement = 'dock' | 'popup';

export interface HelloResponse {
    features: Topic[];
    placement: Placement | 'unknown';
    selectedId?: number;
    session: string;
}

/** Request payloads and their response payloads, by request type. */
export interface Requests {
    'activity.inspect': [{ id: number; path?: PathKey[] }, { value: Encoded }];
    'activity.list': [undefined, { activities: ActivityRecord[] }];
    'activity.reset': [{ id: number }, {}];
    'activity.update': [{ id: number; input: unknown }, {}];
    close: [undefined, {}];
    hello: [{ protocol: number }, HelloResponse];
    highlight: [{ id: number | null }, {}];
    log: [{ id: number }, {}];
    'node.inspect': [
        { id: number; path?: PathKey[] },
        NodeDetails | { value: Encoded }
    ];
    open: [{ placement: Placement }, {}];
    pick: [{ on: boolean }, {}];
    reveal: [{ id: number }, {}];
    select: [{ id: number | null }, {}];
    subscribe: [{ topics: Topic[] }, {}];
    'tree.get': [undefined, { nodes: TreeNode[]; rootIds: number[] }];
}

export type RequestType = keyof Requests;

/** Event payloads, by event type. */
export interface Events {
    'activity.changed': { id: number; pending: boolean; value: Encoded };
    goodbye: undefined;
    'pick.ended': undefined;
    renders: { entries: { causeId?: number; id: number; ms: number }[] };
    selected: { id: number };
    'tree.changed': { ids: number[] };
}

export type EventType = keyof Events;
