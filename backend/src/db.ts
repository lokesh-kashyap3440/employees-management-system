import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectToDatabase = async (uri: string) => {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};