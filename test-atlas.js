const mongoose = require('mongoose');
const uri = "mongodb+srv://mohamednasseremam:FBqAxTJJqF9ySUso@cluster0.qkufdur.mongodb.net/jobito?retryWrites=true&w=majority";

async function test() {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Success!');
        process.exit(0);
    } catch (e) {
        console.error('Failed:', e.message);
        process.exit(1);
    }
}
test();
