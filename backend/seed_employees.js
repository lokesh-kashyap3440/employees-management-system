// seed_employees.js
const API_URL = 'http://localhost:3000/employees';

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
  return {
    name: `${firstName} ${lastName}`,
    position: getRandomElement(positions),
    department: getRandomElement(departments),
    salary: Math.floor(Math.random() * (150000 - 50000 + 1)) + 50000 // 50k to 150k
  };
}

async function seed() {
  console.log('Starting seed...');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < 100; i++) {
    const employee = generateRandomEmployee();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });

      if (response.ok) {
        successCount++;
        if (successCount % 10 === 0) {
            console.log(`Created ${successCount} employees...`);
        }
      } else {
        errorCount++;
        console.error(`Failed to create employee ${i + 1}: ${response.statusText}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error creating employee ${i + 1}:`, error.message);
    }
  }

  console.log(`Seed completed. Success: ${successCount}, Failed: ${errorCount}`);
}

seed();
