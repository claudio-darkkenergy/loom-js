import { generateComponent } from '@loom-js/open-ai';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function createComponent(
    name: string,
    components: string,
    functionality: string
) {
    const code = await generateComponent(name, components, functionality);
    console.log({ code });

    const filePath = join(process.cwd(), 'src', 'components', `${name}.js`);
    await writeFile(filePath, code);

    console.log(`Component ${name} created successfully.`);
}

// Usage
createComponent(
    'UserProfile',
    'Avatar, Button, Card',
    'Display user information and allow editing'
);
