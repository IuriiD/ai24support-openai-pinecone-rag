import axios from 'axios';
import { logger as customLogger } from '../../utils/pinoLogger';
import { getCustomerConfigById } from '../common';
import { Message } from './types';

const log = customLogger(__filename);

// OpenAI Embeddings API - https://platform.openai.com/docs/api-reference/embeddings
export const getEmbeddingsForString = async (customerId: string, text: string): Promise<number[] | null> => {
  try {
    const customerConfig = getCustomerConfigById(customerId);
    if (!customerConfig) {
      return null;
    }

    const url = 'https://api.openai.com/v1/embeddings';

    const headers = {
      Authorization: `Bearer ${customerConfig.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const data = {
      input: text,
      model: 'text-embedding-ada-002',
    };

    const embeddingsRes = await axios.post(url, data, { headers });

    return embeddingsRes.data.data[0].embedding;
  } catch (err) {
    log.error({
      action: 'getEmbeddingsForString',
      result: 'failure',
      e: err.stack,
    });
    throw err;
  }
};

// OpenAI Chat Completion API - https://platform.openai.com/docs/api-reference/chat
export const getChatCompletion = async (customerId: string, messages: Message[]): Promise<string | null> => {
  try {
    const customerConfig = getCustomerConfigById(customerId);
    if (!customerConfig) {
      return null;
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = {
      Authorization: `Bearer ${customerConfig.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const data = {
      messages,
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4-0613',
      temperature: 0,
      frequency_penalty: 1,
    };

    const embeddingsRes = await axios.post(url, data, { headers });

    return embeddingsRes.data.choices[0].message.content;
  } catch (err) {
    log.error({
      action: 'getChatCompletion',
      result: 'failure',
      e: err.stack,
    });
    throw err;
  }
};
