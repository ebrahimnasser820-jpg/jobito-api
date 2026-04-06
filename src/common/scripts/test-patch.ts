async function testPatch() {
  try {
    // First let's get any company
    const response = await fetch('http://localhost:3000/companies');
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const companies = await response.json();
    
    if (companies.length === 0) {
      console.log('No companies found.');
      return;
    }
    const c = companies[companies.length - 1];
    console.log(`Testing PATCH on company ID ${c.company_id}`);
    
    // NOTE: Need a valid token to bypass JwtAuthGuard unless we stub it. 
    // Wait, let's just use the server side logic!
  } catch(e: any) {
    console.error(e.message);
  }
}
testPatch();
