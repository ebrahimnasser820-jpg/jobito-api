const http = require('http');
const server = http.createServer((req, res) => {
  res.end('ok');
});
server.listen(3000, () => {
  console.log('LISTENING ON 3000');
  process.exit(0);
});
server.on('error', (err) => {
  console.error('ERROR:', err.code);
  process.exit(1);
});
