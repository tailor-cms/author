import { body, check, param } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

export const generate = defineRequestValidator([
  body('repository').isObject().notEmpty(),
  body('repository.schemaId').isString().notEmpty(),
  body('repository.name').isString().notEmpty(),
  body('repository.description').isString().notEmpty(),
  body('inputs').isArray({ min: 1 }),
  body('inputs.*.type').isString().isIn(['CREATE', 'ADD', 'MODIFY']),
  body('inputs.*.text').isString().notEmpty(),
  body('inputs.*.responseSchema').isString().notEmpty(),
]);

export const uploadDocuments = defineRequestValidator([
  check('files').custom((_val, { req }) => {
    const files = req.files || [];
    if (!files.length) throw new Error('At least one PDF file is required');
    const invalid = files.filter(
      (f) =>
        f.mimetype !== 'application/pdf' ||
        !f.originalname.toLowerCase().endsWith('.pdf'),
    );
    if (invalid.length) throw new Error('Only PDF files are allowed');
    return true;
  }),
  body('vectorStoreId').optional().isString().notEmpty(),
]);

export const getVectorStoreStatus = defineRequestValidator([
  param('vectorStoreId').isString().notEmpty(),
]);

export const deleteVectorStore = defineRequestValidator([
  param('vectorStoreId').isString().notEmpty(),
]);
