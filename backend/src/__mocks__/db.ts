import { jest } from '@jest/globals';

const mDb = {
  collection: jest.fn().mockReturnThis(),
  insertOne: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn().mockReturnThis(),
  toArray: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

export const connectToDatabase = jest.fn();
export const getDb = jest.fn().mockReturnValue(mDb);
export const closeDB = jest.fn();
