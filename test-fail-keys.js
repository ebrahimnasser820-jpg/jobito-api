const fetch = require('node-fetch');

async function check() {
  try {
    const res = await fetch('http://localhost:3000/translations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: ["Operations Monitor", "Technical Support", "Company Review", "Operations Revenue"],
        target_lang: 'ar'
      })
    });
    const data = await res.json();
    console.log("Batch API Response:", data);
  } catch (err) {
    console.error(err);
  }
}

check();
