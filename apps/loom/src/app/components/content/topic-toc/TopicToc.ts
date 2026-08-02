import { ContentfulDocument, RichText } from '@loom-js/contentful';
import { SimpleComponent } from '@loom-js/core';
import { toKebabCase } from '@loom-js/utils';

import { Toc } from '../toc';

export type TopicTocProps = {
    json?: ContentfulDocument;
};

export const TopicToc: SimpleComponent<TopicTocProps> = ({
    json,
    ...props
}) => {
    const getTocItems = () => {
        if (!json) {
            return [];
        }

        return json.content.reduce<string[]>((acc, { content, nodeType }) => {
            if (nodeType === 'heading-2') {
                const heading = (content[0] as RichText)?.value;
                acc.push(heading);
            }

            return acc;
        }, []);
    };

    return Toc({
        ...props,
        title: 'On this page',
        items: getTocItems().map((title) => ({
            title,
            url: `#${toKebabCase(title)}`
        }))
    });
};
