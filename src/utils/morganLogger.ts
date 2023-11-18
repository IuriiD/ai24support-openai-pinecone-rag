import morgan from 'morgan';

const morganMiddleware = morgan(':method :url :status :res[content-length] - :response-time ms');

export default morganMiddleware;
