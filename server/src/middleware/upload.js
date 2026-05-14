import multer from 'multer';
import { MAX_MB_PER_FILE } from '../constants.js';
export const recordingUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_MB_PER_FILE * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio'
            && (file.mimetype === 'audio/webm' || file.mimetype === 'audio/mp4')) {
            return cb(null, true);
        }
        if (file.fieldname === 'log' && file.mimetype === 'application/json') {
            return cb(null, true)
        }
        cb(new Error('Invalid file type'), false);
    },
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'log', maxCount: 1 },
]);