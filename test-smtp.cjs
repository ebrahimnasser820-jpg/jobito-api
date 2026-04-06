const nodemailer = require('nodemailer');

// Hardcoded for testing since we already read them from .env
const config = {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'mohamednasseremam380@gmail.com',
    pass: 'rqhs fsdn osip ngxz'
};

async function testMail() {
    console.log('Testing SMTP with:', config.user);
    
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: false,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');
        
        const info = await transporter.sendMail({
            from: `"Jobito Test" <${config.user}>`,
            to: config.user,
            subject: 'Jobito SMTP Test',
            text: 'This is a test email to verify SMTP settings.',
        });
        
        console.log('✅ Test email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

testMail();
