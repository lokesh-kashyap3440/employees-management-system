import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase(uri: string): Promise<Db> {
  if (db) {
    return db;
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(); // uses database name from URI
  console.log('✅ Connected to MongoDB');
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
    client = undefined as any;
    db = undefined as any;
  }
}
