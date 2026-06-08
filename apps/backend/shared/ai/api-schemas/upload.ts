// Wire shapes for the PDF upload endpoint.
import { z } from 'zod';

export const UploadInput = z
  .object({
    vectorStoreId: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Existing vector store to extend; omit to create a new one.',
      ),
  })
  .describe('Body for the PDF to vector store upload endpoint.');

export type UploadInput = z.infer<typeof UploadInput>;

const UploadedDocument = z
  .object({
    fileId: z.string().describe('OpenAI file id (e.g. `file_abc123`).'),
    name: z.string().describe('Original filename.'),
  })
  .meta({ id: 'AiUploadedDocument' });

export const UploadResult = z
  .object({
    vectorStoreId: z.string().describe('Vector store the PDFs landed in.'),
    documents: z
      .array(UploadedDocument)
      .describe('Per-file upload result, in input order.'),
  })
  .meta({ id: 'AiUploadResult' })
  .describe('Result of a PDF to vector store upload.');

export type UploadResult = z.infer<typeof UploadResult>;
