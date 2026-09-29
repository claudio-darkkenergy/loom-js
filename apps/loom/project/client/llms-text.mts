// Assembles the two plain-text files the docs site serves for AI agents:
// an index of the topics, and every topic in one markdown file.

export interface LlmsTopic {
    lead: string;
    markdown: string;
    slug: string;
    title: string;
}

export interface LlmsSection {
    title: string;
    topics: LlmsTopic[];
}

export interface LlmsSite {
    name: string;
    origin: string;
    sections: LlmsSection[];
}

const topicUrl = (origin: string, slug: string) => `${origin}/docs/${slug}`;

const allTopics = (sections: LlmsSection[]) =>
    sections.flatMap(({ topics }) => topics);

/**
 * The first sentence of a lead paragraph. A period inside a word or code
 * (`a.b`, `e.g.` mid-sentence) doesn't end it; one followed by a space and
 * a capital does.
 */
export const firstSentence = (lead: string) =>
    lead.split(/(?<=[.!?])\s+(?=[A-Z`[])/)[0]?.trim() ?? '';

/** The index: the pitch, then each section's topics as a link list. */
export const llmsIndex = ({ name, origin, sections }: LlmsSite) => {
    const pitch = allTopics(sections)[0]?.lead ?? '';
    const sectionBlocks = sections.map(({ title, topics }) =>
        [
            `## ${title || 'Docs'}`,
            '',
            ...topics.map(
                (topic) =>
                    `- [${topic.title}](${topicUrl(origin, topic.slug)}): ${firstSentence(topic.lead)}`
            )
        ].join('\n')
    );

    return [
        `# ${name}`,
        `> ${pitch}`,
        `Every topic below in one file: ${origin}/llms-full.txt`,
        ...sectionBlocks
    ]
        .join('\n\n')
        .concat('\n');
};

/** Every topic, in order, each under its title and address. */
export const llmsFull = ({ name, origin, sections }: LlmsSite) =>
    [
        `# ${name}`,
        ...allTopics(sections).map((topic) =>
            [
                `# ${topic.title}`,
                `Source: ${topicUrl(origin, topic.slug)}`,
                topic.markdown
            ].join('\n\n')
        )
    ]
        .join('\n\n')
        .concat('\n');

/** Fails the build on a topic that would ship empty or undescribed. */
export const assertLlmsTopics = (sections: LlmsSection[]) => {
    const topics = allTopics(sections);

    if (!topics.length) {
        throw new Error('[llms-text] no topics to write.');
    }

    topics.forEach(({ lead, markdown, slug }) => {
        if (!firstSentence(lead)) {
            throw new Error(
                `[llms-text] topic "${slug}" has no lead paragraph to describe it.`
            );
        }

        if (markdown.trim().length <= lead.length) {
            throw new Error(
                `[llms-text] topic "${slug}" has no body beyond its lead.`
            );
        }
    });
};
