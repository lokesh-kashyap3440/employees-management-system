// update_employees.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const dbName = 'test'; // Default db name for mongo client if not specified in URI, but usually it's in the connection or method.
// Checking src/db.ts, it uses client.db() which implies default from connection string or 'test'.
// src/index.ts doesn't specify db name in URI 'mongodb://root:example@localhost:27017'.
// By default mongo uses 'test'.

async function updateEmployees() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('employees');

    const result = await collection.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} employees.`);
    console.log(`Matched ${result.matchedCount} employees.`);

  } catch (error) {
    console.error('Error updating employees:', error);
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateEmployees();
