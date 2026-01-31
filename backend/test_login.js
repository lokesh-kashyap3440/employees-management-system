// test_login.js
const LOGIN_URL = 'http://localhost:3000/auth/login';

async function testLogin() {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });

    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${data}`);
  } catch (error) {
    console.error('Error during login test:', error.message);
  }
}

testLogin();
