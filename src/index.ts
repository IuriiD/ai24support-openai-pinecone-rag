/* istanbul ignore file */
import { start as startServer } from './createServer';
import { logger } from './utils/pinoLogger';
import { config } from './config';

const log = logger(__filename);

startServer()
  .then(() => {
    log.info({
      action: 'appStart',
      result: 'success',
      port: config.SERVER_PORT,
    });
  })
  .catch((e) => {
    log.error({
      action: 'appStart',
      result: 'failure',
      e: e.stack,
    });
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  log.warn({
    action: 'appStart',
    result: 'unhandledRejection',
    err,
  });
});

process.on('uncaughtException', (err) => {
  log.fatal({
    action: 'appStart',
    result: 'uncaughtException',
    err,
  });
  process.exit(1);
});
