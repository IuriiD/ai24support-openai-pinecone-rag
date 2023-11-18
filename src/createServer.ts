import express from 'express';
import { Request, Response } from 'express';
import http from 'http';
import { promisify } from 'util';
import { config } from './config';

import { logger as customLogger } from './utils/pinoLogger';
import morganMiddleware from './utils/morganLogger';
import { router as versionInfoRouter } from './routers/versionInfo';
import { router as completionRouter } from './routers/completion';
import sequelizeConnection from './db/connection';

export const app = express();
const httpServer = http.createServer(app);

const startServer = promisify(httpServer.listen.bind(httpServer));
const stopServer = promisify(httpServer.close.bind(httpServer));

const log = customLogger(__filename);

app.use(express.json());
app.use(morganMiddleware);

app.get('/', (_req, res) =>
  res.status(200).send({
    status: 'OK',
  }),
);

app.use('/api/v1', versionInfoRouter);
app.use('/api/v1', completionRouter);

app.use((_req, res) => {
  res.status(404).send('Not Found');
});

app.use((err: Error, _req: Request, res: Response) => {
  log.error({
    action: 'appStart',
    result: 'failure',
    e: err.stack,
  });
  res.status(500);
  res.json({ error: 'Something went wrong!' });
});

export async function start(): Promise<void> {
  if (['testing', 'development'].includes(config.NODE_ENV)) {
    await sequelizeConnection.sync({ alter: true });
  } else {
    await sequelizeConnection.authenticate();
  }
  log.info({
    action: 'appStart',
    result: 'success',
    msg: 'Connected to Postgresql DB',
  });
  await startServer(process.env.PORT || config.SERVER_PORT);
}

export async function stop(): Promise<void> {
  log.info('Stopping server...');
  sequelizeConnection.close();
  await stopServer();
}
