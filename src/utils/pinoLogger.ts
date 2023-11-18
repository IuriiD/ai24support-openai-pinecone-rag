import pino, { Logger, LoggerOptions } from 'pino';

export { Logger };

export function logger(name = '', options: LoggerOptions = {}): Logger {
  let ns = name;
  if (ns) {
    ns = name.replace(/.+\/src/, '');
  }

  const pinoOptions: LoggerOptions = { ...options, name: ns, base: {} };

  return pino(pinoOptions);
}
