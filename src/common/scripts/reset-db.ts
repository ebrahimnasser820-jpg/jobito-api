import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function resetDatabase() {
  try {
    console.log('--- جاري الاتصال بقاعدة البيانات... ---');
    await client.connect();
    console.log('✅ تم الاتصال بنجاح.');

    console.log('🗑️ جاري مسح الـ Schema القديمة (ptj) وكل ما بداخلها...');
    await client.query('DROP SCHEMA IF EXISTS ptj CASCADE;');
    // Clean up old triggers that cause 500 errors
    await client.query('DROP TRIGGER IF EXISTS jobs_tsv_trigger ON ptj.jobs CASCADE');
    await client.query('DROP FUNCTION IF EXISTS ptj.jobs_tsv_trigger() CASCADE');

    console.log('Cleanup: Triggers dropped.');
    await client.query('CREATE SCHEMA ptj;');
    console.log('✅ تم مسح قاعدة البيانات بنجاح.');

    const sqlPath = path.join(process.cwd(), 'src', 'Data', 'jobito_init.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('📄 جاري قراءة ملف التأسيس (jobito_init.sql) لإعادة إدخال البيانات المنظمة...');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await client.query(sql);
      console.log('✅ تم إعادة تهيئة البيانات بنجاح.');
    } else {
      console.log('⚠️ تحذير: ملف jobito_init.sql غير موجود، تم التنظيف فقط.');
    }

    console.log('\n--- ✨ تمت العملية بنجاح! قاعدة البيانات الآن نظيفة ومنظمة. ✨ ---');
  } catch (err) {
    console.error('❌ حدث خطأ أثناء العملية:', err.message);
  } finally {
    await client.end();
    process.exit();
  }
}

resetDatabase();
