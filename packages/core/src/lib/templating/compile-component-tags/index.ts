import type { TemplateTransformPlan } from '../../../types';
import { scan } from './scanner';

// Compiles component-element syntax (`<${Component} …/>`) out of a template's
// chunks, per the accepted grammars in
// `openspec/changes/archive/2026-08-07-add-template-component-syntax/design.md`
// (element syntax) and `openspec/changes/add-named-slots/design.md` (slot
// labels). Returns `null` when the template contains no component tags — the
// caller must then use the original chunks untouched.

export const compileComponentTags = (
    chunks: ArrayLike<string>
): TemplateTransformPlan | null => {
    const last = chunks.length - 1;
    let hasSignal = false;

    // Fast bail-out (Decision 4): only a chunk ending in `<` or `</`
    // immediately before an interpolation can open component syntax.
    for (let chunkIndex = 0; chunkIndex < last; chunkIndex++) {
        const chunk = chunks[chunkIndex] as string;

        if (chunk.endsWith('<') || chunk.endsWith('</')) {
            hasSignal = true;
            break;
        }
    }

    if (!hasSignal) {
        return null;
    }

    const root = scan(chunks, last);

    return { chunks: root.statics, getters: root.getters };
};
