// export const nodesToComponents = false;
import { Mark, helpers } from '@contentful/rich-text-types';

import {
    defaultMarkRenderers,
    defaultNodeRenderers
} from './default-renderers';
import { ContentfulDocument, RichTextNode, Options } from './types';

export const documentToComponents = (
    richTextDocument?: ContentfulDocument,
    options: Options = {}
) => {
    if (!richTextDocument) {
        return null;
    }

    return nodeToComponent(richTextDocument, {
        renderNode: {
            ...defaultNodeRenderers,
            ...options.renderNode
        },
        renderMark: {
            ...defaultMarkRenderers,
            ...options.renderMark
        },
        renderText: options.renderText
    });
};

export const nodesToComponents = (nodes: RichTextNode[], options: Options) =>
    nodes.map((node: RichTextNode): any => {
        return nodeToComponent(node, options);
    });

export const nodeToComponent = (node: RichTextNode, options: Options) => {
    const { renderNode, renderMark, renderText } = options;

    if (helpers.isText(node)) {
        return node.marks.reduce(
            (value: any, mark: Mark): any => {
                if (!renderMark || !renderMark[mark.type]) {
                    return value;
                }

                return renderMark[mark.type](value);
            },
            renderText ? renderText(node.value) : node.value
        );
    } else {
        const children: any = nodesToComponents(node.content, options);

        if (!node.nodeType || !renderNode || !renderNode[node.nodeType]) {
            return children;
        }

        return renderNode[node.nodeType](node, children);
    }
};
