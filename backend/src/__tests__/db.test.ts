import { jest, describe, beforeEach, it, expect } from '@jest/globals';

const mockConnect = jest.fn().mockReturnThis();
const mockDb = jest.fn().mockReturnValue({ name: 'mockDb' });
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: class {
    connect = mockConnect;
    db = mockDb;
    close = mockClose;
  }
}));

const { connectToDatabase, getDb, closeDB } = await import('../db.ts');

describe('Database Utilities', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await closeDB();
  });

  it('should connect to database', async () => {
    await connectToDatabase('mongodb://uri');
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should return database instance', async () => {
    await connectToDatabase('mongodb://uri');
    const db = getDb();
    expect(db.name).toBe('mockDb');
  });

  it('should throw error if getDb called before connect', () => {
    expect(() => getDb()).toThrow('Database not initialized');
  });

  it('should close database connection', async () => {
    await connectToDatabase('mongodb://uri');
    await closeDB();
    expect(mockClose).toHaveBeenCalled();
  });
});
