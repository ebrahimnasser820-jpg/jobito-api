const API_BASE_URL = 'http://localhost:3000';

async function cleanup() {
  try {
    const res = await fetch('http://localhost:3000/companies/dev/cleanup');
    const data = await res.json();
    console.log('Cleanup result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

cleanup();

