const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:ZgNlXbOEKrKzGgKjITnQzUqfVqIuItuM@viaduct.proxy.rlwy.net:18195/railway',
  synchronize: false,
});

ds.initialize().then(async () => {
  const res = await ds.query(`SELECT * FROM translation WHERE en IN ('Company Review', 'Operations Monitor', 'Operations Revenue')`);
  console.log('Database records:', res);
  process.exit(0);
}).catch(console.error);
