import { logger as customLogger } from '../utils/pinoLogger';
import { Message, Role } from '../services/openai/types';
import { getChatCompletion, getEmbeddingsForString } from '../services/openai';
import { saveConversationEntry } from '../db';
import { getContextsAndHandoverTriggersByVector } from './pinecone';

const log = customLogger(__filename);

const prompts = {
  qnaPrompt: {
    systemMessageSmallTalk: `
    You are an experienced and professional customer service agent of ExampleShop, tasked with kindly responding to customer inquiries.

    Give the answer in markdown format. Always answer in English. Keep your answers concise.

    Determine if user's message belongs to the small talk categories specified below and delimited by +++++.

    If user message does NOT belong to these defined small talk categories, respond "I haven't found relevant info in my knowledge base. Let me please pass you to a live agent". Otherwise politely respond and ask the user about the subject of their question.

    +++++Small Talk categories:
    Greeting: User message simply contains greetings, for example hi, hello, good morning
    Farewell: User is saying goodbye, e.g. bye, see you
    Thanks: User simply expresses gratitude, e.g. thanks, tnx
    Profanity: User message contains swear words, obscene language, e.g. what the fuck
    Affirmative: User simply responds with a confirmation, such as yes, sure
    Negative: User responds wit a denial, e.g. no+++++
    `,
    systemMessageQnA: `
    You are an experienced and professional customer service agent of ExampleShop, tasked with kindly responding to customer inquiries.
    Give the answer in markdown format. Always answer in English. Keep your answers concise.

    You only know the information provided in the VECTOR_CONTEXT. Do not make up any info which is not present in VECTOR_CONTEXT.
    If VECTOR_CONTEXT doesn't provide enough details to answer user's question, ask the user to provide more details or rephrase the question.
    Generate each response based on the following VECTOR_CONTEXT: <context>

    If VECTOR_CONTEXT references any resources (addresses, links, phone numbers, lists), include them in the ANSWER.
    `,
  },
};

export const getHandleSmallTalkPrompt = (query: string): Message[] => {
  try {
    const contextEnhancedSystemMessage = prompts.qnaPrompt.systemMessageSmallTalk;

    const messages = [
      {
        role: Role.system,
        content: contextEnhancedSystemMessage,
      },
      {
        role: Role.user,
        content: query,
      },
    ];

    return messages;
  } catch (err) {
    log.error({
      action: 'getHandleSmallTalkPrompt',
      result: 'failure',
      e: err.stack,
    });
  }
};

export const getQnAPrompt = (context: string, query: string): Message[] => {
  try {
    const contextEnhancedSystemMessage = prompts.qnaPrompt.systemMessageQnA.replace('<context>', context);

    const messages = [
      {
        role: Role.system,
        content: contextEnhancedSystemMessage,
      },
      {
        role: Role.user,
        content: query,
      },
    ];

    return messages;
  } catch (err) {
    log.error({
      action: 'getQnAPrompt',
      result: 'failure',
      e: err.stack,
    });
  }
};

export const getAiCompletion = async (customerId: string, query: string): Promise<string> => {
  try {
    const queryEmbeddings = await getEmbeddingsForString(customerId, query);
    const vectorDbRes = await getContextsAndHandoverTriggersByVector(queryEmbeddings, 0.85, 0.9); // move thresholds to configs
    const contexts = vectorDbRes.relevantMatchesKb;
    const handoverRequests = vectorDbRes.relevantMatchesHandovers;

    console.log(`\n\n>> HandoverRequests \n${JSON.stringify(handoverRequests)}\n\n`);
    const isHandoverRequest = handoverRequests.length;
    if (isHandoverRequest) {
      log.info({
        action: 'getAiCompletion',
        result: 'success',
        customerId,
        msg: `Message seems to be a handover request`,
      });
      return 'Looks like this is a task for a human. Let me please pass you to a live agent';
    }

    log.info({
      action: 'getAiCompletion',
      result: 'success',
      customerId,
      msg: `Found ${contexts.length} context documents`,
    });
    console.log(`\n\n### >> Contexts \n${JSON.stringify(contexts)}\n\n`);

    let promptMessages = [];
    if (contexts.length === 0) {
      log.info({
        action: 'getAiCompletion',
        result: 'success',
        customerId,
        msg: `No relevant docs were found. AI to handle small talk or trigger handover`,
      });
      promptMessages = getHandleSmallTalkPrompt(query);
    } else {
      // Temporary use only 2 top contexts
      const topContextsArr = contexts.slice(0, 2);
      log.info({
        action: 'getAiCompletion',
        result: 'success',
        customerId,
        msg: `topContext: ${JSON.stringify(topContextsArr)}`,
      });

      // TODO: deduplicate (there might be several contexts with different questions but same response)
      const topContext = topContextsArr.map((context) => context.text).join(' ') || 'EMPTY';

      promptMessages = getQnAPrompt(
        // Temporary limit doc length by 4k characters.
        // TODO: add contexts summarization to fit the token limit
        topContext.slice(0, 4000) || '',
        query,
      );
    }
    console.log(`\n\n### >> PromptMessages \n${JSON.stringify(promptMessages)}\n\n`);

    log.info({
      action: 'getAiCompletion',
      result: 'success',
      customerId,
      msg: `promptMessages: ${JSON.stringify(promptMessages)}`,
    });

    const contextEnhancedAnswer = await getChatCompletion(customerId, promptMessages);
    log.info({
      action: 'getAiCompletion',
      result: 'success',
      customerId,
      msg: `contextEnhancedAnswer: ${contextEnhancedAnswer}`,
    });
    console.log(`\n\n### >> ContextEnhancedAnswer ###\n${contextEnhancedAnswer}\n\n`);

    return contextEnhancedAnswer;
  } catch (err) {
    log.error({
      action: 'getAiCompletion',
      result: 'failure',
      e: err.stack,
    });
  }
};

export const handleAiCompletion = async (customerId: string, userId: string, query: string): Promise<string> => {
  log.info({
    action: 'handleAiCompletion',
    msg: 'start',
    result: 'success',
    customerId,
    userId,
    query,
  });
  try {
    const aiAnswer = await getAiCompletion(customerId, query);
    await saveConversationEntry(userId, customerId, query, Role.user);
    await saveConversationEntry(userId, customerId, aiAnswer, Role.assistant);
    return aiAnswer;
  } catch (err) {
    log.error({
      action: 'handleAiCompletion',
      result: 'failure',
      customerId,
      userId,
      e: err.stack,
    });
  }
};
