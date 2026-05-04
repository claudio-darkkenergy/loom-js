import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client
} from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { VercelRequest, VercelResponse } from '@vercel/node';

const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_BUCKET_NAME =
    process.env.AWS_BUCKET_NAME || 'loom-js-docs-event-logs';
const AWS_BUCKET_PREFIX = process.env.AWS_BUCKET_PREFIX || 'app-event-logs';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: awsCredentialsProvider({
        roleArn: AWS_ROLE_ARN
    })
});

export default async function POST(req: VercelRequest, res: VercelResponse) {
    console.log('headers', req.headers);
    try {
        // Read the request body as text
        const bodyText = await req.body;
        const timestamp = new Date().toISOString();

        // Create a log entry with timestamp and request data
        const logEntry = JSON.stringify({
            timestamp,
            data: JSON.parse(bodyText)
        });

        const today = timestamp.split('T')[0];
        const logKey = `${AWS_BUCKET_PREFIX}/${today}.json`;

        // Check if the log file for today exists
        let existingLogs = '';

        try {
            const getObjectParams = {
                Bucket: AWS_BUCKET_NAME,
                Key: logKey,
                Response: 'text'
            };
            const getObjectCommand = new GetObjectCommand(getObjectParams);
            const data = await s3Client.send(getObjectCommand);

            existingLogs = await sdkStreamMixin(data.Body).transformToString();
        } catch (error: unknown) {
            if (error instanceof Error && error.name !== 'NoSuchKey') {
                throw error;
            }
        }

        // Append new log entry
        const updatedLogs = existingLogs
            ? `${existingLogs}\n${logEntry}`
            : logEntry;

        // Upload the updated log file
        const putObjectParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: logKey,
            Body: updatedLogs,
            ContentType: 'application/json'
        };

        const putObjectCommand = new PutObjectCommand(putObjectParams);
        await s3Client.send(putObjectCommand);
        console.log('Log sent to S3 successfully');
        res.status(200)
            .setHeader('Access-Control-Allow-Origin', '*')
            .json({ message: 'Log sent to S3 successfully' });
    } catch (error) {
        console.error('Error sending log to S3:', error);
        res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({
            error: 'Error sending log to S3'
        });
    }
}
