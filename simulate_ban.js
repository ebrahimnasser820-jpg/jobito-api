async function main() {
  const payload = {
    targetUserId: "8f21c609-c4a4-4f2e-a61d-2ff8747b001f",
    actionType: "ban",
    reason: "ؤلالا"
  };

  console.log('Sending request to /admin/ops/users/action unauthenticated...');
  try {
    const response = await fetch('http://localhost:3000/admin/ops/users/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
