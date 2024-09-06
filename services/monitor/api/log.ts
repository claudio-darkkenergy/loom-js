import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const env = {
    awsS3LogRegion: 'us-east-1',
    awsS3LogBucket: 'loom-js-docs-event-logs',
    awsS3LogPrefix: 'app-event-logs/',
    awsS3LogAccessId: process.env.LOOM_S3_MON_LOG_AWS_ACCESS_KEY_ID,
    awsS3LogAccessSecret: process.env.LOOM_S3_MON_LOG_AWS_SECRET_ACCESS_KEY
};

const s3Client = new S3Client({
    region: env.awsS3LogRegion,
    credentials: {
        accessKeyId: env.awsS3LogAccessId,
        secretAccessKey: env.awsS3LogAccessSecret
    }
});

export async function log(message) {
    const params = {
        Bucket: env.awsS3LogBucket,
        Key: `${env.awsS3LogPrefix}${Date.now()}.json`,
        Body: message,
        ContentType: 'application/json'
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log('Log sent to S3 successfully');
    } catch (error) {
        console.error('Error sending log to S3:', error);
    }
}
