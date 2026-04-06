const API_URL = 'http://localhost:3000/chat';
const userId = '12345678-1234-1234-1234-123456789012'; // Example PostgreSQL UUID
const sessionId = `session-${Date.now()}`;

async function testChat() {
    console.log(`Testing ChatBot with Session ID: ${sessionId}`);

    try {
        // 1. Send Text Message
        console.log('\n1. Sending text message...');
        const textRes = await fetch(`${API_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                sessionId,
                sender: 'user',
                type: 'text',
                content: 'Hello! I am looking for React jobs.',
            }),
        });
        console.log('Status:', textRes.status);
        console.log('Response:', await textRes.json());

        // 2. Send Image Message
        console.log('\n2. Sending image message...');
        const imageRes = await fetch(`${API_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                sessionId,
                sender: 'user',
                type: 'image',
                mediaUrl: 'https://example.com/image.png',
            }),
        });
        console.log('Status:', imageRes.status);
        console.log('Response:', await imageRes.json());

        // 3. Send Audio Message
        console.log('\n3. Sending audio message...');
        const audioRes = await fetch(`${API_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                sessionId,
                sender: 'user',
                type: 'audio',
                mediaUrl: 'https://example.com/audio.mp3',
            }),
        });
        console.log('Status:', audioRes.status);
        console.log('Response:', await audioRes.json());

        // 4. Send Video Message
        console.log('\n4. Sending video message...');
        const videoRes = await fetch(`${API_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                sessionId,
                sender: 'user',
                type: 'video',
                mediaUrl: 'https://example.com/video.mp4',
            }),
        });
        console.log('Status:', videoRes.status);
        console.log('Response:', await videoRes.json());

        // 5. Fetch History
        console.log('\n5. Fetching session history...');
        const historyRes = await fetch(`${API_URL}/history/${sessionId}`);
        const historyData = await historyRes.json();
        console.log('History Count:', historyData.length);

        console.log('\nVerification complete!');
    } catch (error) {
        console.error('Error during verification:', error.message);
        console.log('\nMake sure the server is running on http://localhost:3000');
    }
}

testChat();
