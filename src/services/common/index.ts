import { config, CustomerConfig } from '../../config';
import { logger as customLogger } from '../../utils/pinoLogger';

const log = customLogger(__filename);

const { CUSTOMER_CONFIGS } = config;

export const getCustomerConfigById = (customerId: string): CustomerConfig | null => {
  try {
    for (const config of CUSTOMER_CONFIGS) {
      if (config['x-customer-id'] === customerId) {
        return config;
      }
    }

    log.error({
      action: 'getCustomerConfig',
      result: 'failure',
      customerId,
      msg: `Config for customer id ${customerId} was not found`,
    });

    return null;
  } catch (err) {
    log.error({
      action: 'getCustomerConfig',
      result: 'failure',
      e: err.stack,
    });
  }
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
