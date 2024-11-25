import PromiseQueue from 'promise-queue';
import createLogger from '#logger';
import { ExportJob, ImportJob } from './job.js';

const logger = createLogger();

class TransferService {
  constructor() {
    this.queue = new PromiseQueue(1, Infinity);
  }

  createExportJob(outFile, options, id) {
    const exportJob = new ExportJob(outFile, options, id);
    this.queue.add(() => exportJob.run());
    setupLogging(exportJob);
    return exportJob;
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
