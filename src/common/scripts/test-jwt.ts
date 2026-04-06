const jwt = require("jsonwebtoken");

const API_BASE_URL = "http://localhost:3000";
const SECRET = "G7d9!kL#2rP@zXwQ";

async function ping() {
    const token = jwt.sign({
        sub: "test-user-id",
        email: "test@example.com",
        role: "student"
    }, SECRET, { expiresIn: '1h' });

    console.log("Generated Token:", token);

    try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ full_name: "Test Update" })
        });

        console.log("Response Status:", res.status);
        console.log("Response Headers:", Object.fromEntries(res.headers.entries()));

        if (!res.ok) {
            const errText = await res.text();
            console.log("FAILED DECODING:", errText);
        } else {
            console.log("SUCCESS!", await res.json());
        }
    } catch (e) {
        console.error("Crash", e);
    }
}

ping();
