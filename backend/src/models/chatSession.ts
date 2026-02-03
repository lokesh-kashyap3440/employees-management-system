import { ObjectId } from 'mongodb';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  _id?: ObjectId;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
