import multer from 'multer';
import { MAX_MB_PER_FILE } from '../constants.js';
import { err, ErrorCode } from '../utils/errors.js';

const upload = multer({
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
        const error = new multer.MulterError('INVALID_FILE_TYPE');
        error.message = 'Invalid file type';
        cb(error);
    },
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'log', maxCount: 1 },
]);

export const recordingUpload = (req, res, next) => {
    upload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json(err(ErrorCode.VALIDATION_FAILED, error.message));
        }
        if (error) return next(error); // Global error handler will catch
        next();
    });
};