import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
mkdirSync(UPLOAD_DIR, { recursive: true });

// Return instance with user_id subdirectory, create if it doesn't exist - ex: uploads/{user_id}/
export function configureStorage() {
    try {
        return multer.diskStorage({
            destination: async (req, file, cb) => {
                const userUploadDir = path.join(process.cwd(), 'uploads', req.userId);
                const fileName = `rec_${req.userId}_${Date.now()}`;
                await fs.mkdir(userUploadDir, { recursive: true });
                cb(null, userUploadDir);
            }
        });
    } catch (err) {
        throw new Error(`Failed to configure storage: ${err.message}`);
    }
}