/* istanbul ignore file */
import { Request, Response } from 'express';
import { logger } from '../utils/pinoLogger';
import { getCustomerConfigById } from '../services/common';

const log = logger(__filename);

export default (req: Request, res: Response, next: () => any): any => {
  const customerId = req.headers['x-customer-id'];
  const apiKey = req.headers['x-api-key'];

  log.debug({
    action: 'auth middleware',
    result: 'success',
    data: req.headers,
  });

  if (!customerId || !apiKey) {
    const msg = 'Missing authorization header';
    log.error({
      action: 'auth middleware',
      result: 'failure',
      msg,
    });
    res.status(400);
    return res.send(msg);
  }

  const customerConfig = getCustomerConfigById(customerId as string);
  if (!customerConfig || apiKey !== customerConfig['x-api-key']) {
    const msg = 'Customer not found or invalid authorization';
    log.error({
      action: 'auth middleware',
      result: 'failure',
      msg,
    });
    res.status(400);
    return res.send(msg);
  }

  next();
};
