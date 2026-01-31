// reset_employees.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Jennifer', 'William', 'Lisa', 'Joseph', 'Angela', 'Thomas', 'Melissa', 'Charles', 'Michelle', 'Daniel', 'Amanda'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const positions = ['Software Engineer', 'Product Manager', 'Data Scientist', 'HR Specialist', 'Sales Representative', 'Marketing Manager', 'Designer', 'DevOps Engineer', 'QA Engineer', 'Business Analyst'];
const departments = ['Engineering', 'Product', 'Data', 'Human Resources', 'Sales', 'Marketing', 'Design', 'Operations', 'Quality Assurance', 'Business'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomEmployee() {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const now = new Date();
  return {
    name: `${firstName} ${lastName}`,
    position: getRandomElement(positions),
    department: getRandomElement(departments),
    salary: Math.floor(Math.random() * (150000 - 50000 + 1)) + 50000,
    createdBy: 'admin',
    createdAt: now,
    updatedAt: now
  };
}

async function reset() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('employees');

    // Delete all
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} employees.`);

    // Create 50
    const newEmployees = [];
    for (let i = 0; i < 50; i++) {
      newEmployees.push(generateRandomEmployee());
    }

    const insertResult = await collection.insertMany(newEmployees);
    console.log(`✅ Recreated ${insertResult.insertedCount} employees.`);

  } catch (error) {
    console.error('Error resetting employees:', error);
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

reset();
