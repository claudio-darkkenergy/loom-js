import { Block, Inline, Text as RichText } from '@contentful/rich-text-types';
import { TemplateTagValue } from '@loom-js/core';

export type { Document as ContentfulDocument } from '@contentful/rich-text-types';

export type RichTextNode = Block | Inline | RichText;

export interface MarkRenderer {
    (children: TemplateTagValue): TemplateTagValue;
}

export interface NodeRenderer {
    (node: Block | Inline, children: TemplateTagValue): TemplateTagValue;
}

export interface RenderNode {
    // [k: BLOCKS[keyof BLOCKS]]
    [k: string]: NodeRenderer;
}

export interface RenderMark {
    // [k: MARKS[keyof MARKS]]
    [k: string]: MarkRenderer;
}

export interface RenderText {
    (children: TemplateTagValue): TemplateTagValue;
}

export interface Options {
    /**
     * Mark renderers
     */
    renderMark?: RenderMark;
    /**
     * Node renderers
     */
    renderNode?: RenderNode;
    /**
     * Text renderer
     */
    renderText?: RenderText;
}
