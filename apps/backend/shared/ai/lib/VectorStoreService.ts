import type OpenAI from 'openai';
import { toFile } from 'openai';

import { ai as aiConfig } from '#config';
import { createAiLogger } from '../logger.ts';

const logger = createAiLogger('vector-store');
const { name: STORE_NAME, expiresAfter: STORE_EXPIRY } = aiConfig.vectorStore;

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

  private async listFiles(vectorStoreId: string) {
    const files = [];
    for await (const f of this.client.vectorStores.files.list(vectorStoreId)) {
      files.push(f);
    }
    return files;
  }

  async upload(
    files: { buffer: Buffer; originalname: string; mimetype?: string }[],
    vectorStoreId?: string,
  ): Promise<UploadResult> {
    const id = vectorStoreId || (await this.createStore());
    const documents = await Promise.all(
      files.map((f) => this.uploadFile(id, f)),
    );
    logger.info(`Uploaded ${documents.length} file(s) to store ${id}`);
    return { vectorStoreId: id, documents };
  }

  // For text content, we can directly create a buffer and upload
  async ingest(
    vectorStoreId: string,
    content: string,
    filename: string,
  ): Promise<UploadedDocument> {
    const buffer = Buffer.from(content, 'utf-8');
    return this.uploadFile(vectorStoreId, {
      buffer,
      originalname: filename,
      mimetype: 'text/markdown',
    });
  }

  async remove(storeId: string, fileId: string): Promise<void> {
    if (!storeId || !fileId) {
      const msg = `Skipping remove: missing storeId=${storeId} fileId=${fileId}`;
      logger.warn(msg);
      return;
    }
    try {
      await this.client.vectorStores.files.delete(fileId, {
        vector_store_id: storeId,
      });
      await this.client.files.delete(fileId).catch(() => {});
      logger.info(`Removed file ${fileId} from store ${storeId}`);
    } catch (err) {
      logger.error(err, `Failed to remove file ${fileId}`);
    }
  }

  async getStatus(vectorStoreId: string): Promise<StoreStatus> {
    const storeFiles = await this.listFiles(vectorStoreId);
    const files = storeFiles.map((f) => ({ fileId: f.id, status: f.status }));
    return {
      isReady: files.length > 0 && files.every((f) => f.status === 'completed'),
      isFailed: files.some((f) => f.status === 'failed'),
      files,
    };
  }

  async createStore(): Promise<string> {
    const store = await this.client.vectorStores.create({
      name: STORE_NAME,
      expires_after: STORE_EXPIRY,
    });
    logger.info(`Created vector store ${store.id}`);
    return store.id;
  }

  async deleteStore(vectorStoreId: string): Promise<void> {
    try {
      const files = await this.listFiles(vectorStoreId);
      await Promise.all(
        files.map((f) => this.client.files.delete(f.id).catch(() => {})),
      );
      await this.client.vectorStores.delete(vectorStoreId);
      logger.info(`Deleted store ${vectorStoreId} with ${files.length} file(s)`);
    } catch (err) {
      logger.error(err, 'Vector store cleanup failed');
    }
  }

  private async uploadFile(
    id: string,
    {
      buffer,
      originalname,
      mimetype,
    }: { buffer: Buffer; originalname: string; mimetype?: string },
  ): Promise<UploadedDocument> {
    const file = await toFile(buffer, originalname, {
      type: mimetype || 'application/octet-stream',
    });
    const result = await this.client.vectorStores.files.upload(id, file);
    return { fileId: result.id, name: originalname };
  }
}
