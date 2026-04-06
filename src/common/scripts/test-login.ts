const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  email: 'mlpoknbv8097@gmail.com',
  password: 'mlpoknbv'
});

let out = '';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    out += `Login Status: ${res.statusCode}\n`;
    out += `Login Body: ${body}\n`;
    try {
      const token = JSON.parse(body).access_token;
      if (token) {
        testBulkFetch(token);
      } else {
        fs.writeFileSync('test-out.txt', out);
      }
    } catch(e) {
      fs.writeFileSync('test-out.txt', out);
    }
  });
});

req.on('error', e => { out += `Error: ${e.message}\n`; fs.writeFileSync('test-out.txt', out); });
req.write(data);
req.end();

function testBulkFetch(token) {
  const bulkData = JSON.stringify([]);
  const bulkReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/jobs/bulk',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': bulkData.length,
      'Authorization': 'Bearer ' + token
    }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      out += `Bulk Status: ${res.statusCode}\n`;
      out += `Bulk Body: ${body}\n`;
      fs.writeFileSync('test-out.txt', out);
    });
  });
  bulkReq.on('error', e => { out += `Bulk Error: ${e.message}\n`; fs.writeFileSync('test-out.txt', out); });
  bulkReq.write(bulkData);
  bulkReq.end();
}
