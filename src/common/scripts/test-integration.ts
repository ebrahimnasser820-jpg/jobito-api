const API_BASE_URL = "http://localhost:3000";

async function runTest() {
    console.log("=== API Integration Test ===");

    // 1. Try to login and get a token from the ACTUAL Server Route
    // Assuming a static test user exists or just trying a dummy login to see error types
    try {
        console.log("1. Authenticating via /auth/login...");
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Using the user that probably exists locally based on previous tests
            body: JSON.stringify({ email: "test@company.com", password: "password123" })
        });

        if (!loginRes.ok) {
            console.log("Login failed!", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log("SUCCESS! Retrieved Backend Token:", token.substring(0, 30) + '...');

        // 2. Use that exact token against /users/me
        console.log("2. Verifying token via /users/me...");
        const profileRes = await fetch(`${API_BASE_URL}/users/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ full_name: "Integration Test" })
        });

        console.log("Profile Update Status:", profileRes.status);
        console.log("Profile Update Body:", await profileRes.text());

    } catch (e) {
        console.error("Test Crash:", e);
    }
}

runTest();
