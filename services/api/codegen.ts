import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

export default async function POST(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body as { prompt?: string };

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }]
        });

        const generatedCode = completion.choices[0]?.message.content;
        console.log('Successfully generated code!');
        res.status(200).json({ code: generatedCode });
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({
            error: 'An error occurred while generating code'
        });
    }
}
