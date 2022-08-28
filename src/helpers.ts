import { TemplateRoot } from './types';

/**
 * Returns the template root (`Node`) or their parent if it's a `NodeList`.
 * @param root `TemplateRoot`
 * @returns `Node`
 */
export const getTemplateRoot = (root?: TemplateRoot) =>
    root instanceof NodeList ? root[0]?.parentElement : root;
