import fs from 'node:fs';
import path from 'node:path';

import type { EndpointResponse } from './common';
import { formatResponse } from './common';
import BaseClient from './BaseClient';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

class AssetClient extends BaseClient {
  constructor() {
    super('/api/repositories/');
  }

  private assetUrl(repositoryId: number, path = '') {
    return this.getUrl(`${repositoryId}/assets/${path}`);
  }

  uploadFile = async (
    repositoryId: number,
    filePath: string,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.assetUrl(repositoryId), {
      multipart: {
        files: {
          name: path.basename(filePath),
          mimeType: getMimeType(filePath),
          buffer: fs.readFileSync(filePath),
        },
      },
    });
    return formatResponse(res);
  };

  addLink = async (
    repositoryId: number,
    url: string,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.assetUrl(repositoryId, 'import/link'), {
      data: { url },
    });
    return formatResponse(res);
  };

  list = async (
    repositoryId: number,
    params: Record<string, any> = {},
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(this.assetUrl(repositoryId), { params });
    return formatResponse(res);
  };

  remove = async (
    repositoryId: number,
    assetId: number,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.delete(this.assetUrl(repositoryId, `${assetId}`));
    return formatResponse(res);
  };

  bulkRemove = async (
    repositoryId: number,
    assetIds: number[],
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.assetUrl(repositoryId, 'bulk/remove'), {
      data: { assetIds },
    });
    return formatResponse(res);
  };

  updateMeta = async (
    repositoryId: number,
    assetId: number,
    meta: Record<string, any>,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.patch(this.assetUrl(repositoryId, `${assetId}`), {
      data: { meta },
    });
    return formatResponse(res);
  };

  getDownloadUrl = async (
    repositoryId: number,
    assetId: number,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(
      this.assetUrl(repositoryId, `${assetId}/download`),
    );
    return formatResponse(res);
  };

  indexAssets = async (
    repositoryId: number,
    assetIds: number[],
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.assetUrl(repositoryId, 'index'), {
      data: { assetIds },
    });
    return formatResponse(res);
  };

  getIndexingStatus = async (
    repositoryId: number,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(this.assetUrl(repositoryId, 'index/status'));
    return formatResponse(res);
  };
}

export default new AssetClient();
