const API_BASE_URL = 'http://localhost:3000';

const run = async () => {
    try {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMjY1Y2UxYS1lNmVlLTQ5MTctODc0YS1jMjY2OWE4YmRhYjEiLCJlbWFpbCI6Im1scG9rbmJ2ODA5N0BnbWFpbC5jb20iLCJyb2xlIjoiY29tcGFueSIsIm5hbWUiOiJOaWxlIERpZ2l0YWwgU3lzdGVtcyIsImF2YXRhciI6bnVsbCwiaWF0IjoxNzcyOTc5Nzg3LCJleHAiOjE3NzI5ODMzODd9.5H0MoblGQ2S1h4Q1By9KfBh4H1GrtUxTVPnAzm8KhkA";
        const response = await fetch('http://localhost:3000/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Backend Developer',
                description: 'desc',
                salary: 1000,
                address: 'addr',
                job_type: 'event',
                slots_available: 1,
                company_id: 1,
                category_id: 1
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (err) {
        console.log(err);
    }
}
run();
