require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const args = process.argv.slice(2);

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing in .env file');
    process.exit(1);
  }

  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected successfully!\n');

  const usersCollection = mongoose.connection.db.collection('users');

  // If no arguments, just list users/admins
  if (args.length === 0) {
    console.log('🔍 Fetching all admin users (or users)...');
    
    // First try to find users with role 'admin'
    let admins = await usersCollection.find({ role: 'admin' }).toArray();
    
    // If no admins found, let's fetch any users to see what's there
    if (admins.length === 0) {
      console.log('⚠️ No users found with role="admin". Fetching first 10 users in DB to check:');
      admins = await usersCollection.find({}).limit(10).toArray();
    }

    if (admins.length === 0) {
      console.log('📭 No users found in the database at all.');
    } else {
      console.log('--- User List ---');
      admins.forEach(u => {
        console.log(`Email: ${u.email} | Role: ${u.role || 'N/A'}`);
      });
      console.log('-----------------');
    }

    console.log('\n🔑 TO CHANGE A PASSWORD, run the script like this:');
    console.log('node reset-admin-password.js <user_email> <new_password>');
    process.exit(0);
  }

  // If arguments provided, reset password
  if (args.length === 2) {
    const targetEmail = args[0];
    const newPassword = args[1];

    console.log(`🔍 Looking for user with email: ${targetEmail}`);
    const user = await usersCollection.findOne({ email: targetEmail });

    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log('💾 Saving new password to database...');
    await usersCollection.updateOne(
      { email: targetEmail },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Password updated successfully!');
    process.exit(0);
  }

  console.log('⚠️ Invalid arguments.');
  console.log('Usage 1 (list): node reset-admin-password.js');
  console.log('Usage 2 (reset): node reset-admin-password.js <email> <new_password>');
  process.exit(1);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
