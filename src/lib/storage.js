import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

/**
 * Base Storage Provider Interface
 */
class StorageProvider {
    async upload(file, folder) {
        throw new Error('Upload method not implemented');
    }
}

/**
 * Local Storage Provider
 */
class LocalStorageProvider extends StorageProvider {
    async upload(file, folder) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        return `/uploads/${folder}/${fileName}`;
    }
}

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3 Storage Provider (AWS S3, Cloudflare R2, etc.)
 */
class S3StorageProvider extends StorageProvider {
    async upload(file, folder) {
        const config = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'auto',
            bucket: process.env.AWS_BUCKET_NAME,
            endpoint: process.env.AWS_ENDPOINT, // Optional for R2
        };

        if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
            throw new Error('S3 configuration missing (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME)');
        }

        const client = new S3Client({
            region: config.region,
            endpoint: config.endpoint,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name}`;
        const key = `${folder}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            ACL: 'public-read', // Optional, depends on bucket settings
        });

        try {
            await client.send(command);

            // Construct Public URL
            if (config.endpoint) {
                // For R2 or custom endpoints
                return `${config.endpoint}/${config.bucket}/${key}`;
            } else {
                // Standard AWS S3 URL
                return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
            }
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error(`S3 Upload Failed: ${error.message}`);
        }
    }
}

/**
 * Supabase Storage Provider
 */
class SupabaseStorageProvider extends StorageProvider {
    async upload(file, folder) {
        const config = {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: process.env.SUPABASE_SERVICE_ROLE_KEY,
            bucket: process.env.SUPABASE_BUCKET_NAME,
        };

        if (!config.url || !config.key || !config.bucket) {
            throw new Error('Supabase configuration missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME)');
        }

        // This would require @supabase/supabase-js
        console.warn('Supabase Storage Provider not fully implemented. Please install @supabase/supabase-js');
        throw new Error('Supabase Storage Provider not implemented');
    }
}

/**
 * Storage Factory
 */
const getStorageProvider = () => {
    const provider = process.env.STORAGE_PROVIDER || 'local';

    switch (provider.toLowerCase()) {
        case 's3':
        case 'r2':
            return new S3StorageProvider();
        case 'supabase':
            return new SupabaseStorageProvider();
        case 'local':
        default:
            return new LocalStorageProvider();
    }
};

export const storage = getStorageProvider();
