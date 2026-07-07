import * as yup from 'yup';
import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLifecycleConfigurationCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PassThrough } from 'node:stream';
import { Upload } from '@aws-sdk/lib-storage';
import { validateConfig } from '../validation.js';
import appConfig from '#config';
import mime from 'mime-types';
import path from 'node:path';

const noop = () => {};

// File isn't in storage;
// callers can treat a miss as "absent" instead of erroring.
const isNotFound = (err) =>
  err?.Code === 'NoSuchKey' ||
  err?.name === 'NotFound' ||
  err?.$metadata?.httpStatusCode === 404;

export const schema = yup.object().shape({
  region: yup.string().required(),
  bucket: yup.string().required(),
  key: yup.string(),
  secret: yup.string(),
  endpoint: yup.string(),
});

class Amazon {
  constructor(config) {
    config = validateConfig(config, schema);

    const s3Config = {
      signatureVersion: 'v4',
      region: config.region,
      apiVersion: '2006-03-01',
      maxRetries: 3,
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
      s3Config.forcePathStyle = true;
    }

    if (config.key && config.secret) {
      s3Config.credentials = {
        accessKeyId: config.key,
        secretAccessKey: config.secret,
      };
    }

    this.bucket = config.bucket;
    this.region = config.region;
    this.client = new S3Client(s3Config);
    if (config.endpoint) this.initTestBucket().catch(() => {});
  }

  static create(config) {
    return new Amazon(config);
  }

  async initTestBucket(retries = 5) {
    const endpoint = await this.client.config.endpoint();
    // Only auto-create buckets against localhost (LocalStack)
    if (endpoint.hostname !== 'localhost') return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch {
        if (!retries) return;
        await new Promise((r) => setTimeout(r, 3000));
        return this.initTestBucket(retries - 1);
      }
    }
  }

  path(...segments) {
    segments = [this.bucket, ...segments];
    return path.join(...segments);
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
  getFile(key, options = {}) {
    const params = Object.assign(options, { Bucket: this.bucket, Key: key });
    return this.client
      .send(new GetObjectCommand(params))
      .then(({ Body: data }) => data.transformToByteArray())
      .then(Buffer.from)
      .catch((err) => {
        if (isNotFound(err)) return null;
        return Promise.reject(err);
      });
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
  async createReadStream(key, options = {}) {
    const throughStream = new PassThrough();
    const params = Object.assign(options, {
      Bucket: this.bucket,
      Key: key,
      Body: throughStream,
      ContentType: options.ContentType || mime.lookup(key),
    });
    const s3Item = await this.client.send(new GetObjectCommand(params));
    s3Item.Body.pipe(throughStream);
    return throughStream;
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/putobjectcommand.html
  saveFile(key, data, options = {}) {
    const params = Object.assign(options, {
      Bucket: this.bucket,
      Key: key,
      Body: data,
    });
    return this.client.send(new PutObjectCommand(params));
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/classes/_aws_sdk_lib_storage.Upload.html
  createWriteStream(key, options = {}) {
    const throughStream = new PassThrough();
    const params = Object.assign(options, {
      Bucket: this.bucket,
      Key: key,
      Body: throughStream,
      ContentType: options.ContentType || mime.lookup(key),
    });
    const upload = new Upload({ client: this.client, params });
    upload.done().catch(noop);
    return throughStream;
  }

  // Streams `readable` to S3 via a managed multipart upload and awaits
  // completion, so errors surface to the caller (unlike createWriteStream's
  // fire-and-forget done()). Used for large asset uploads.
  async saveStream(key, readable, options = {}) {
    const params = Object.assign({}, options, {
      Bucket: this.bucket,
      Key: key,
      Body: readable,
      ContentType: options.ContentType || mime.lookup(key),
    });
    await new Upload({ client: this.client, params }).done();
    return { key };
  }

  // Lists in-progress (incomplete) multipart uploads, optionally only those
  // older than `olderThanMs`. Detection hook for orphaned upload parts left by
  // a crash; the lifecycle rule does the actual cleanup. S3-only concept.
  async listIncompleteUploads({ olderThanMs = 0 } = {}) {
    const { Uploads = [] } = await this.client.send(
      new ListMultipartUploadsCommand({ Bucket: this.bucket }),
    );
    const cutoff = olderThanMs ? Date.now() - olderThanMs : Infinity;
    return Uploads.filter(
      (it) => !it.Initiated || it.Initiated.getTime() < cutoff,
    ).map((it) => ({
      key: it.Key,
      uploadId: it.UploadId,
      initiated: it.Initiated,
    }));
  }

  // Returns the bucket's lifecycle rules ([] if none). Used at startup to verify
  // the AbortIncompleteMultipartUpload rule is enabled; the only thing that
  // sweeps multipart parts orphaned by a hard crash (invisible in object
  // listings, billed until removed).
  async getLifecycleRules() {
    try {
      const { Rules = [] } = await this.client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: this.bucket }),
      );
      return Rules;
    } catch (err) {
      // S3 raises NoSuchLifecycleConfiguration when nothing is set.
      if (err.name === 'NoSuchLifecycleConfiguration') return [];
      throw err;
    }
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/copyobjectcommand.html
  copyFile(key, newKey, options = {}) {
    const { base, ...rest } = path.parse(key);
    const encodedSource = path.format({
      base: encodeURIComponent(base),
      ...rest,
    });
    const params = Object.assign(
      options,
      { Bucket: this.bucket },
      {
        CopySource: this.path(`/${encodedSource}`),
        Key: newKey,
      },
    );
    return this.client.send(new CopyObjectCommand(params));
  }

  moveFile(key, newKey, options = {}) {
    return this.copyFile(key, newKey, options).then((result) =>
      this.deleteFile(key).then(() => result),
    );
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/deleteobjectcommand.html
  deleteFile(key, options = {}) {
    const params = Object.assign(options, { Bucket: this.bucket, Key: key });
    return this.client.send(new DeleteObjectCommand(params));
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/deleteobjectscommand.html
  deleteFiles(keys, options = {}) {
    const objects = keys.map((key) => ({ Key: key }));
    if (!keys.length) return Promise.resolve();
    const params = Object.assign(options, {
      Bucket: this.bucket,
      Delete: { Objects: objects },
    });
    return this.client.send(new DeleteObjectsCommand(params));
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
  listFiles(key, options = {}) {
    const params = Object.assign(options, { Bucket: this.bucket, Prefix: key });
    return this.client
      .send(new ListObjectsV2Command(params))
      .then(({ Contents: files }) => files.map((file) => file.Key));
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
  fileExists(key) {
    const params = { Bucket: this.bucket, Key: key };
    return this.client.send(new HeadObjectCommand(params)).catch((err) => {
      if (isNotFound(err)) return null;
      return Promise.reject(err);
    });
  }

  // Bucket reachability probe (health checks). HeadBucket succeeds when the
  // bucket exists and credentials are valid; it doesn't depend on any object
  // existing, so an empty bucket is still healthy. Only a real
  // connectivity/permission error rejects.
  healthCheck() {
    return this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  // API docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
  getFileUrl(key, options = {}) {
    const expires = options.expires || appConfig.storage.signedUrlTtl;
    const params = Object.assign(options, { Bucket: this.bucket, Key: key });
    const command = new GetObjectCommand(params);
    return getSignedUrl(this.client, command, { expiresIn: expires });
  }
}

export const create = Amazon.create.bind(Amazon);
