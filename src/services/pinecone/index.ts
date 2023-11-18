import { PineconeClient } from '@pinecone-database/pinecone';

import { logger as customLogger } from '../../utils/pinoLogger';
import { config } from '../../config';

const log = customLogger(__filename);

export let pineconeClient: PineconeClient | null = null;
export let pinecone: any;

export const initPinecone = async () => {
  try {
    pineconeClient = new PineconeClient();
    await pineconeClient.init({
      environment: config.PINECONE_ENVIRONMENT,
      apiKey: config.PINECONE_API_KEY,
    });
    log.info({
      action: 'pineconeInit',
      result: 'success',
      msg: 'initialized pinecone',
    });
  } catch (error) {
    log.error({
      action: 'pineconeInit',
      result: 'failure',
      e: error.stack,
    });
  }
};

(async () => {
  await initPinecone();
  pinecone = pineconeClient.Index(config.PINECONE_INDEX_NAME);
})();
