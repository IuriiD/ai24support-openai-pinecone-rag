/* istanbul ignore file */
import express from 'express';
import { version as packageVersion } from '../../package.json';
import { serviceName } from '../constants';

export const router = express.Router();
router.use('/version', (_req, res) => {
  res.json({
    [serviceName]: {
      version: packageVersion,
    },
  });
});
