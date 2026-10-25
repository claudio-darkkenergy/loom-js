import { type Component, component } from '@loom-js/core';

import type { Encoded, PathKey } from '../../protocol/types';
import { type Expansions, pathString } from '../state';

export interface ValueContext {
    expansions: Expansions;
    onExpand(path: PathKey[]): void;
    onSelectNode(id: number): void;
    onToggle(path: PathKey[]): void;
    openPaths: Set<string>;
}

const quote = (text: string) => JSON.stringify(text);

/** A one-line preview of an encoded value. */
export const previewOf = (value: Encoded): string => {
    switch (value.t) {
        case 'str':
            return value.length
                ? `${quote(value.v)}… (${value.length} chars)`
                : quote(value.v);
        case 'num':
        case 'bool':
            return String(value.v);
        case 'bigint':
            return `${value.v}n`;
        case 'symbol':
            return `Symbol(${value.v})`;
        case 'date':
            return `Date ${value.v}`;
        case 'fn':
            return `ƒ ${value.name}()`;
        case 'error':
            return `${value.name}: ${value.message}`;
        case 'array':
            return `Array(${value.length})`;
        case 'object':
            return `${value.ctor ? `${value.ctor} ` : ''}{${value.size ? '…' : ''}}`;
        case 'map':
            return `Map(${value.size})`;
        case 'set':
            return `Set(${value.size})`;
        case 'node':
            return `<${value.tag}>`;
        case 'activity':
            return value.name;
        case 'component':
            return `<${value.name} />`;
        default:
            return value.t;
    }
};

const isExpandable = (value: Encoded) =>
    (value.t === 'array' && value.length > 0) ||
    ((value.t === 'object' || value.t === 'map' || value.t === 'set') &&
        value.size > 0);

// The child entries an expandable value inlined: [label, path key, value].
const childrenOf = (
    value: Encoded
): [string, PathKey, Encoded][] | undefined => {
    switch (value.t) {
        case 'array':
            return value.items?.map((item, index) => [
                String(index),
                index,
                item
            ]);
        case 'object':
            return value.entries?.map(([key, item]) => [key, key, item]);
        case 'map':
            return value.entries?.map(([key, item], index) => [
                previewOf(key),
                index,
                item
            ]);
        case 'set':
            return value.entries?.map(([, item], index) => [
                String(index),
                index,
                item
            ]);
        default:
            return undefined;
    }
};

export interface ValueRowProps {
    context: ValueContext;
    label: string;
    path: PathKey[];
    value: Encoded;
}

export const ValueRow: Component<ValueRowProps> = component<ValueRowProps>(
    (html, { context, label, path, value }) => {
        const key = pathString(path);
        const resolved = context.expansions.get(key) ?? value;
        const expandable = isExpandable(resolved);
        const isOpen = expandable && context.openPaths.has(key);
        const children = isOpen ? childrenOf(resolved) : undefined;
        const toggle = () => {
            context.onToggle(path);
            !isOpen && !childrenOf(resolved) && context.onExpand(path);
        };
        const linkedNode = resolved.t === 'node' ? resolved.id : undefined;

        return html`
            <li class="value-row">
                <div class="value-line">
                    <button
                        class=${`value-toggle ${expandable ? '' : 'is-hidden'}`}
                        $click=${toggle}
                        type="button"
                    >
                        ${isOpen ? '▾' : '▸'}
                    </button>
                    <span class="value-key">${label}</span>
                    <span
                        class=${`value-preview is-${resolved.t} ${linkedNode ? 'is-link' : ''}`}
                        $click=${linkedNode ? () => context.onSelectNode(linkedNode) : undefined}
                    >
                        ${previewOf(resolved)}
                    </span>
                </div>
                ${isOpen ? ValueChildren({ context, items: children ?? [], path }) : ''}
            </li>
        `;
    },
    { name: 'ValueRow' }
);

interface ValueChildrenProps {
    context: ValueContext;
    items: [string, PathKey, Encoded][];
    path: PathKey[];
}

const ValueChildren: Component<ValueChildrenProps> =
    component<ValueChildrenProps>(
        (html, { context, items, path }) => html`
            <ul class="value-list">
                ${items.map(([label, childKey, value]) =>
                    ValueRow({
                        context,
                        key: pathString([...path, childKey]),
                        label,
                        path: [...path, childKey],
                        value
                    })
                )}
            </ul>
        `,
        { name: 'ValueChildren' }
    );
