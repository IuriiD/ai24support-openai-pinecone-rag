import { Conversation, User, Customer } from './models';
import { logger as customLogger } from '../utils/pinoLogger';

const log = customLogger(__filename);

export const findOrCreateCustomer = async (customerId: string): Promise<string> => {
  try {
    const [customer] = await Customer.findOrCreate({
      where: { id: customerId },
    });
    return customer?.id;
  } catch (err) {
    const msg = `Failed to create customer with id ${customerId}`;
    log.error({
      action: 'findOrCreateCustomer',
      result: 'failure',
      e: err.stack,
      msg,
    });
    throw err;
  }
};

export const findOrCreateUser = async (userId: string, customerId: string): Promise<string> => {
  try {
    const [user] = await User.findOrCreate({
      where: {
        id: userId,
        customer_id: customerId,
      },
    });
    return user?.id;
  } catch (err) {
    const msg = `Failed to create user with id ${userId} for customer ${customerId}`;
    log.error({
      action: 'findOrCreateUser',
      result: 'failure',
      e: err.stack,
      msg,
    });
    throw err;
  }
};

export const saveConversationEntry = async (
  userId: string,
  customerId: string,
  content: string,
  role = 'user',
): Promise<void | Error> => {
  try {
    const customerIdFound = await findOrCreateCustomer(customerId);

    if (customerIdFound) {
      log.info({
        action: 'saveConversationEntry - findOrCreateCustomer',
        result: 'success',
        customer: customerIdFound,
        msg: `Customer id ${customerIdFound} exists`,
      });
    }

    const userIdFound = await findOrCreateUser(userId, customerId);

    if (userIdFound) {
      log.info({
        action: 'saveConversationEntry - findOrCreateUser',
        result: 'success',
        customer: customerIdFound,
        user: userIdFound,
        msg: `Created new user, id ${customerIdFound}`,
      });
    }

    const conversation = await Conversation.create({
      user_id: userIdFound,
      customer_id: customerIdFound,
      content,
      role,
    });

    log.info({
      action: 'saveConversationEntry - create conv. record',
      result: 'success',
      customer: customerIdFound,
      user: userIdFound,
      msg: `Created new conversation record, id ${conversation.id}`,
    });
  } catch (err) {
    log.error({
      action: 'saveConversationEntry',
      result: 'failure',
      e: err.stack,
    });
  }
};
