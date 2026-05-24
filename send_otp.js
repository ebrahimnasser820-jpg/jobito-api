// send_otp.js - sends OTP request to Jobito API
(async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/send-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testotp@example.com', phone: '01092554077' }),
    });
    const data = await response.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
})();
