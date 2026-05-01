import fetch from 'node-fetch'; // assuming node 18+ or node-fetch

async function testGemini() {
  const geminiApiKey = 'AIzaSyAJineSTe7j8NBV9zLpVhKy9lF1cubQYcw';
  const systemPrompt = `You are Tevis...`; // Truncated for test
  const message = 'Hello, testing connection.';
  
  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: "Understood." }] },
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    console.log("Status:", response.status, response.statusText);
    const text = await response.text();
    console.log("Response:", text);
  } catch(e) {
    console.error(e);
  }
}

testGemini();
