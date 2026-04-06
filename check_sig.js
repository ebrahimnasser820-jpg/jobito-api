
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDVjNGMyZC00OGY3LTQxNDMtODMwNi1mMmUzZTExNGQ2NTciLCJlbWFpbCI6InJvbGFuYWVlbTIwMDRAZ21haWwuY29tIiwicm9sZSI6ImNvbXBhbnkiLCJpYXQiOjE3NzE5Mjg5MDgsImV4cCI6MTc3MTkzMjUwOH0.FY-OMR_OmIR4e1tj2rWG9mD1pBvAeimnn7aLErXhWzs';

const secrets = [
  'G7d9!kL#2rP@zXwQ',
  'your-secret-key'
];

secrets.forEach(secret => {
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`✅ Success with secret: ${secret}`);
    console.log(JSON.stringify(decoded, null, 2));
  } catch (err) {
    console.log(`❌ Failed with secret: ${secret} (${err.message})`);
  }
});
