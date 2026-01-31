import { jest } from '@jest/globals';

// Mock db.ts
jest.mock('../db.ts', () => {
  const mDb = {
    collection: jest.fn().mockReturnThis(),
    insertOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  return {
    connectToDatabase: jest.fn(),
    getDb: jest.fn().mockReturnValue(mDb),
  };
});
