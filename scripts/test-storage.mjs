import 'dotenv/config';
import { storage } from '../src/lib/storage.js';
import fs from 'fs';
import path from 'path';

async function testUpload() {
    console.log('--- Testing Storage Upload ---');
    console.log('Storage Provider:', process.env.STORAGE_PROVIDER || 'local (default)');

    // Create a mock file
    const content = 'This is a test receipt content.';
    const buffer = Buffer.from(content);

    // Mock File object (minimal interface required by storage.js)
    const mockFile = {
        name: 'test-receipt.txt',
        arrayBuffer: async () => {
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        },
        size: buffer.length,
        type: 'text/plain'
    };

    try {
        console.log('Attempting upload...');
        const url = await storage.upload(mockFile, 'test-uploads');
        console.log('Upload successful!');
        console.log('File URL:', url);

        // Verify file exists for local storage
        if ((process.env.STORAGE_PROVIDER || 'local') === 'local') {
            const filePath = path.join(process.cwd(), 'public', url);
            if (fs.existsSync(filePath)) {
                console.log('Verified: File exists on disk at', filePath);
            } else {
                console.error('Error: File not found on disk at', filePath);
            }
        }
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

testUpload();
