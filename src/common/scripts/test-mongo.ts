const mongoose = require('mongoose');

const uri = "mongodb+srv://mohamednasseremam:FBqAxTJJqF9ySUso@cluster0.qkufdur.mongodb.net/authDB?retryWrites=true&w=majority";

async function testMongoConnection() {
    console.log('⏳ Attempting to connect to MongoDB Atlas (5s timeout)...');
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Successfully connected to MongoDB Atlas!');

        const db = mongoose.connection.db;
        const adminDb = db.admin(); 

        console.log('📊 Fetching server status...');
        const serverStatus = await adminDb.serverStatus();
        console.log(`- Version: ${serverStatus.version}`);
        console.log(`- Uptime: ${serverStatus.uptime} seconds`);
        console.log(`- Active Connections: ${serverStatus.connections.current}`);

        console.log('📁 Fetching databases...');
        const dbsList = await adminDb.listDatabases();
        console.log('- Databases found:');
        dbsList.databases.forEach(dbinfo => {
            console.log(`  * ${dbinfo.name} (Size: ${(dbinfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB Atlas.');
        console.error('Error specifics:');
        console.error(error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('🔌 Disconnected.');
        }
    }
}

testMongoConnection();
