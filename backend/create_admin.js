// create_admin.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const mongoUri = process.env.MONGODB_URI;
const username = 'admin';
const password = 'admin';
const role = 'admin';

async function createAdmin() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      console.log(`User '${username}' already exists. Updating role to admin...`);
      await usersCollection.updateOne({ username }, { $set: { role: 'admin' } });
      console.log('Role updated.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await usersCollection.insertOne({
      username,
      password: hashedPassword,
      role
    });

    console.log(`✅ Admin user created with ID: ${result.insertedId}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

createAdmin();
