import type { Logger } from 'pino';

/**
 * Process-level lifecycle hooks: last-resort crash logging and shutdown
 * signals. Called from the entrypoint (the only module that owns the
 * process) before the boot chain starts, so crashes during boot are
 * covered too.
 */
export const registerProcessHandlers = (logger: Logger) => {
  // Without these hooks a crash only prints Node's raw stack to stderr;
  // invisible to JSON log pipelines and alerting. After an uncaught error
  // the process state can't be trusted, so log at `fatal` and exit; the
  // process manager restarts a clean instance.
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'Unhandled promise rejection');
    process.exit(1);
  });
  // Shutdown is a loggable system event (OWASP), same as the startup
  // lines: without it, a stopped service and a crashed-without-a-trace one
  // look identical in the logs.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      logger.info(`Received ${signal}, shutting down`);
      process.exit(0);
    });
  }
};
