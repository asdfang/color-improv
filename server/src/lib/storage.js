import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET } from './r2.js';

const EXT_BY_AUDIO_MIME = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
}

export function audioExtFor(audioMimeType) {
    const ext = EXT_BY_AUDIO_MIME[audioMimeType];
    if (!ext) throw new Error(`Unsupported audio MIME type: ${audioMimeType}`);
    return ext;
}

export function keyFor(userId, baseFilename, extension) {
    return `${userId}/${baseFilename}.${extension}`;
}

export async function uploadToR2(key, buffer, contentType) {
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
}

export async function cleanupByKeys(keys) {
    await Promise.allSettled(keys.map(key =>
        r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    ));
}