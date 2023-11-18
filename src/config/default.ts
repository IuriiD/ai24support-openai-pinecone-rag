import { Environment, ConfigType } from './types';

export const defaultConfig: ConfigType = {
  NODE_ENV: Environment.development,
  SERVER_PORT: 3000,
  CUSTOMER_CONFIGS: [],
  PINECONE_ENVIRONMENT: '',
  PINECONE_API_KEY: '',
  PINECONE_INDEX_NAME: '',
  POSTGRESQL_CONNECTION_STRING: '',
  SIMILARITY_SEARCH_LIMIT: 0.8,
  TOP_K: 5,
};
