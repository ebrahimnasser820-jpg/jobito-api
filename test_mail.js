const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mohamednasseremam380@gmail.com',
    pass: 'ilynoevmkemvhaak',
  },
});

async function test() {
  console.log('🔄 Testing Gmail SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified!');
    
    const info = await transporter.sendMail({
      from: '"Jobito" <mohamednasseremam380@gmail.com>',
      to: 'Ahmedhabashy898@gmail.com',
      subject: 'Jobito Test — Gmail SMTP Works!',
      text: 'If you see this, Gmail SMTP is working correctly! 🎉',
    });
    console.log('✅ Email sent! MessageID:', info.messageId);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
  }
}

test();
