export const toCamelCase = (str: string) => {
    return str
        .split('-')
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
};

export const toKebabCase = (str: string) => {
    // Create Project => create-project
    // CreateProject => create-project
    return str
        .trim()
        .split(/(?:\s|(?<=[a-z])(?=[A-Z]))/)
        .join('-')
        .toLowerCase();
};
