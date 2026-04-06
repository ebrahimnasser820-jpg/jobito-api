
async function logJobs() {
    try {
        const res = await fetch('http://localhost:3000/jobs');
        if (!res.ok) {
            console.log(`Error: ${res.status}`);
            return;
        }
        const jobs = await res.json();
        console.log('JOBS:', JSON.stringify(jobs, null, 2));
    } catch(e) {
        console.error(e);
    }
}
logJobs();
