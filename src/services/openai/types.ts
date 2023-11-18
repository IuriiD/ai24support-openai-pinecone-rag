export enum Role {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
}

export type Message = {
  content: string;
  role: Role;
};
