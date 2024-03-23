export interface GraphQlQueryOptions {
    args?: string[];
    fragments?: string[];
    queries: string[];
    queryLabel?: string;
    queryType?: 'query' | 'mutation';
}

export const createQuery = ({
    args = [],
    fragments = [],
    queries = [],
    queryLabel = '',
    queryType = 'query'
}: GraphQlQueryOptions) => `
    ${queryType}${queryLabel && ` ${queryLabel}`}${args.length && `(${args.join(', ')})`} {
        ${queries.join('\n')}
    }
    ${fragments.join('\n')}
`;
