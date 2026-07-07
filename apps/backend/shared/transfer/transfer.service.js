import PromiseQueue from 'promise-queue';
import { ExportJob, ImportJob } from './job.js';
import { createLogger } from '#logger';

const logger = createLogger('transfer:service');

class TransferService {
  constructor() {
    this.queue = new PromiseQueue(1, Infinity);
    this.exportJobs = new Map();
  }

  createExportJob(outFile, options, id) {
    const exportJob = new ExportJob(outFile, options, id);
    this.exportJobs.set(exportJob.id, exportJob);
    this.queue.add(() => exportJob.run());
    setupLogging(exportJob);
    return exportJob;
  }

  getExportJob(id) {
    return this.exportJobs.get(id);
  }

  removeExportJob(id) {
    this.exportJobs.delete(id);
  }

  createImportJob(inFile, options) {
    const importJob = new ImportJob(inFile, options);
    this.queue.add(() => importJob.run());
    setupLogging(importJob);
    return importJob;
  }
}

export default new TransferService();

function setupLogging(job) {
  job.once('success', () =>
    logger.info({ job: job.toJSON() }, 'Job completed successfully'),
  );
  job.once('error', (err) =>
    logger.error({ job: job.toJSON(), err }, 'Job failed to complete'),
  );
}
