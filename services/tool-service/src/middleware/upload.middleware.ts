import multer from 'multer';
import { errorResponse } from '@neighbortools/shared-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

// Error handler for multer errors
export function handleUploadError(err: any, req: any, res: any, next: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(errorResponse('File too large. Maximum size is 10MB.'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(errorResponse('Too many files. Maximum is 5 files.'));
    }
    return res.status(400).json(errorResponse(`Upload error: ${err.message}`));
  }

  if (err) {
    return res.status(400).json(errorResponse(err.message));
  }

  next();
}
