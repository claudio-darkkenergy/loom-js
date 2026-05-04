import { componentTemplate } from './prompt-templates';

export async function generateComponent(
    componentName: string,
    pinkComponents: string,
    functionality: string
) {
    const prompt = componentTemplate
        .replace('{componentName}', componentName)
        .replace('{pinkComponents}', pinkComponents)
        .replace('{functionality}', functionality);

    console.log('lib', { prompt });

    try {
        const response = await fetch('http://localhost:3001/api/codegen', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        console.log('lib', { url: response.url, status: response.status });
        const { code } = await response.json();

        console.log('lib', { code });

        return code;
    } catch (error) {
        console.error('lib', { error });
    }
}
