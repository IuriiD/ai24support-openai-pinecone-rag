export enum Environment {
  development = 'development',
  staging = 'staging',
  testing = 'testing',
  production = 'production',
  test = 'test',
}

export type CustomerConfig = {
  OPENAI_API_KEY: string;
  OPENAI_ORG: string;
  'x-customer-id': string;
  'x-api-key': string;
};

export type ConfigType = {
  NODE_ENV: Environment;
  SERVER_PORT: number;
  CUSTOMER_CONFIGS: CustomerConfig[];
  PINECONE_ENVIRONMENT: string;
  PINECONE_API_KEY: string;
  PINECONE_INDEX_NAME: string;
  POSTGRESQL_CONNECTION_STRING: string;
  SIMILARITY_SEARCH_LIMIT: number;
  TOP_K: number;
};
