const bcrypt = require('bcrypt');

// Using async/await (recommended)
async function hashPassword() {
  try {
    const hash = await bcrypt.hash('Govt@1234', 10);
    console.log('Hashed password:', hash);
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

hashPassword();

// Alternative: Using .then().catch() with proper error handling
/*
bcrypt.hash('Govt@1234', 10)
  .then(hash => {
    console.log('Hashed password:', hash);
  })
  .catch(error => {
    console.error('Error hashing password:', error);
  });
*/