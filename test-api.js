const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/jobs?limit=10', // Test with small limit first
  method: 'GET',
};

console.log(`Testing GET http://localhost:3000${options.path}...`);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`BODY LENGTH: ${data.length}`);
    try {
      const parsed = JSON.parse(data);
      console.log(`PARSED SUCCESSFULLY. Data count: ${parsed.data ? parsed.data.length : 'N/A'}`);
    } catch (e) {
      console.error(`PARSE FAILED: ${e.message}`);
      console.log(`RAW BODY START: ${data.substring(0, 500)}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.end();
