import { Sequelize } from 'sequelize-typescript';
import { config } from '../config';
import { Conversation, User, Customer } from './models';

const { POSTGRESQL_CONNECTION_STRING } = config;
const sequelizeConnection = new Sequelize(POSTGRESQL_CONNECTION_STRING, {
  dialect: 'postgres',
  models: [Conversation, User, Customer],
});

export default sequelizeConnection;
