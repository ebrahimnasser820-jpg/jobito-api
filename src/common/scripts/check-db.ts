async function check() {
  try {
    const res = await fetch('http://localhost:3000/companies');
    if (!res.ok) {
        console.log(`Error: ${res.status} ${res.statusText}`);
        return;
    }
    const companies = await res.json();
    console.log('Total companies:', companies.length);
    companies.forEach(c => {
      console.log(`ID: ${c.company_id}, Name: ${c.name}, Email: ${c.contact_email}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
