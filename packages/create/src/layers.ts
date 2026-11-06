// Template layers: real file trees under `templates/`, copied base → server
// → ui → tailwind. A path may be overridden by at most one non-base layer,
// so the copy order never decides a file's content.
import { type Choices, NONE } from './choices';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface Layer {
    name: string;
    /** File contents by path relative to the app directory. */
    files: Record<string, string>;
}

export type LayerReader = (name: string) => Promise<Layer>;

/** The layer names a set of choices copies, in order. */
export const layerNamesFor = ({ spa, tailwind, ui }: Choices) => [
    'base',
    ...(spa ? [] : ['server']),
    ...(ui === NONE ? [] : [`ui/${ui}`]),
    ...(tailwind ? ['tailwind'] : [])
];

/** Merges layers; throws when two non-base layers write the same path. */
export const mergeLayers = (layers: readonly Layer[]) => {
    const files: Record<string, string> = {};
    const owners = new Map<string, string>();

    for (const { files: layerFiles, name } of layers) {
        for (const [filePath, content] of Object.entries(layerFiles)) {
            const owner = owners.get(filePath);

            if (owner && owner !== 'base') {
                throw new Error(
                    `[create] layers "${owner}" and "${name}" both write ${filePath}.`
                );
            }

            owners.set(filePath, name);
            files[filePath] = content;
        }
    }

    return files;
};

/** Reads layers from a template tree on disk (`<root>/<layer>/**`). */
export const diskLayerReader =
    (root: string): LayerReader =>
    async (name) => {
        const directory = path.join(root, name);
        const entries = await readdir(directory, {
            recursive: true,
            withFileTypes: true
        });
        const files: Record<string, string> = {};

        for (const entry of entries.filter((item) => item.isFile())) {
            const absolute = path.join(entry.parentPath, entry.name);
            const relative = path
                .relative(directory, absolute)
                .split(path.sep)
                .join('/');

            files[relative] = await readFile(absolute, 'utf8');
        }

        return { files, name };
    };
