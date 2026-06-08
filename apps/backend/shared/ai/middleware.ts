// Middleware for the /ai HTTP API.
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

// Multer instance shared by the upload route.
export const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
});

export function validatePdfFiles(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const files = (req as any).files ?? [];
  if (!files.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      errors: [
        {
          type: 'field',
          msg: 'At least one PDF file is required',
          path: 'files',
          location: 'files',
        },
      ],
    });
  }
  const invalid = files.filter(
    (f: any) =>
      f.mimetype !== 'application/pdf' ||
      !f.originalname.toLowerCase().endsWith('.pdf'),
  );
  if (invalid.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      errors: [
        {
          type: 'field',
          msg: 'Only PDF files are allowed',
          path: 'files',
          location: 'files',
        },
      ],
    });
  }
  return next();
}
