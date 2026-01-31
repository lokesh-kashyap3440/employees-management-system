// check_db.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

async function checkDb() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('test');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    console.log('Users in database:', users);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDb();
