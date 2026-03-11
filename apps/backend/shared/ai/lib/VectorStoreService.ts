import type OpenAI from 'openai';
import { toFile } from 'openai';

import { createLogger } from '#logger';

const logger = createLogger('ai:vector-store');

const PDF_MIME = { type: 'application/pdf' };
const STORE_NAME = 'tailor-cms';
const STORE_EXPIRY = { anchor: 'last_active_at' as const, days: 60 };

interface UploadedDocument {
  fileId: string;
  name: string;
}

interface UploadResult {
  vectorStoreId: string;
  documents: UploadedDocument[];
}

interface FileStatus {
  fileId: string;
  status: string;
}

interface StoreStatus {
  isReady: boolean;
  isFailed: boolean;
  files: FileStatus[];
}

export class VectorStoreService {
  private client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  async upload(
    files: { buffer: Buffer; originalname: string }[],
    vectorStoreId?: string,
  ): Promise<UploadResult> {
    const id = vectorStoreId || (await this.createStore());
    const documents = await Promise.all(
      files.map((f) => this.uploadFile(id, f)),
    );
    logger.info(`Uploaded ${documents.length} file(s) to store ${id}`);
    return { vectorStoreId: id, documents };
  }

  async getStatus(vectorStoreId: string): Promise<StoreStatus> {
    const { data } = await this.client.vectorStores.files.list(vectorStoreId);
    const files = data.map((f) => ({ fileId: f.id, status: f.status }));
    return {
      isReady: files.length > 0 && files.every((f) => f.status === 'completed'),
      isFailed: files.some((f) => f.status === 'failed'),
      files,
    };
  }

  async deleteStore(vectorStoreId: string): Promise<void> {
    try {
      const { data } = await this.client.vectorStores.files.list(vectorStoreId);
      await Promise.all(
        data.map((f) => this.client.files.delete(f.id).catch(() => {})),
      );
      await this.client.vectorStores.delete(vectorStoreId);
      logger.info(`Deleted store ${vectorStoreId} with ${data.length} file(s)`);
    } catch (err) {
      logger.error(err, 'Vector store cleanup failed');
    }
  }

  private async uploadFile(
    id: string,
    { buffer, originalname }: { buffer: Buffer; originalname: string },
  ): Promise<UploadedDocument> {
    const file = await toFile(buffer, originalname, PDF_MIME);
    const result = await this.client.vectorStores.files.upload(id, file);
    return { fileId: result.id, name: originalname };
  }

  private async createStore(): Promise<string> {
    const store = await this.client.vectorStores.create({
      name: STORE_NAME,
      expires_after: STORE_EXPIRY,
    });
    logger.info(`Created vector store ${store.id}`);
    return store.id;
  }
}
