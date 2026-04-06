const http = require('http');

http.get('http://localhost:3000/jobs', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
    try {
        const json = JSON.parse(data);
        console.log('TOTAL:', json.total);
        console.log('DATA LENGTH:', json.data ? json.data.length : 'N/A');
    } catch (e) {
        console.log('PARSE ERROR');
    }
  });
}).on('error', (err) => {
  console.log('ERROR:', err.message);
});
