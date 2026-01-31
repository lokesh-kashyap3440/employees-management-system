// update_users_role.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

async function updateUsersRole() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('users');

    const result = await collection.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} users.`);
    console.log(`Matched ${result.matchedCount} users.`);

  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateUsersRole();
