import { connectDB, closeDB } from './db.ts';
import { Employee } from './models/employee.ts';

const firstNames = [
  'Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
  'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Ryan', 'Sophia', 'Thomas',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zach', 'Aaron', 'Bella', 'Caleb', 'Diana',
  'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Marcus', 'Nina',
  'Oscar', 'Penelope', 'Quentin', 'Rachel', 'Samuel', 'Tara', 'Uriel', 'Vanessa', 'William', 'Xena',
  'Yusuf', 'Zara', 'Adam', 'Beth', 'Carl', 'Daisy', 'Eddie', 'Faith', 'Gavin', 'Hazel',
  'Isaac', 'Jasmine', 'Kyle', 'Lily', 'Mason', 'Nora', 'Owen', 'Piper', 'Quincy', 'Ruby',
  'Simon', 'Tessa', 'Ulysses', 'Violet', 'Wyatt', 'Ximena', 'Yohan', 'Zoe', 'Alex', 'Brooke',
  'Cody', 'Delilah', 'Eric', 'Felicity', 'Graham', 'Harper', 'Ivan', 'Jocelyn', 'Keith', 'Lucy'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes'
];

const positions = [
  'Engineer', 'Manager', 'Designer', 'Developer', 'Analyst', 'Consultant', 'Director', 'Coordinator',
  'Specialist', 'Administrator', 'Technician', 'Supervisor', 'Executive', 'Associate', 'Lead', 'Architect'
];

function generatePhone(): string {
  return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`;
}

async function seedEmployees() {
  try {
    await connectDB();
    console.log('Connected to database');

    const employees = [];
    
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      
      employees.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        position
      });
    }

    const result = await Employee.insertMany(employees);
    console.log(`Successfully inserted ${result.length} employees`);
    
    await closeDB();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
}

seedEmployees();