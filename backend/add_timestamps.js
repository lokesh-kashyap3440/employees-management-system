// add_timestamps.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

async function addTimestamps() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('employees');

    // For employees missing timestamps, use their _id to get approximate creation time
    // or just use current date if not possible/complex.
    // MongoDB ObjectId contains timestamp.
    
    const cursor = collection.find({ updatedAt: { $exists: false } });
    let count = 0;

    for await (const doc of cursor) {
      const timestamp = doc._id.getTimestamp();
      await collection.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            createdAt: timestamp,
            updatedAt: timestamp 
          } 
        }
      );
      count++;
    }

    console.log(`Updated ${count} employees with timestamps.`);

  } catch (error) {
    console.error('Error adding timestamps:', error);
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

addTimestamps();
