import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/MOHAM/Project/Jobito/jobito-api/.env' });

async function testMail() {
    console.log('Testing with user:', process.env.MAIL_USER);
    
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');
        
        const info = await transporter.sendMail({
            from: `"Jobito Test" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER,
            subject: 'Jobito SMTP Test',
            text: 'This is a test email to verify SMTP settings.',
        });
        
        console.log('✅ Test email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

testMail();
