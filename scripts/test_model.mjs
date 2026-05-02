const apiKey = 'AIzaSyDePbOQEMXa7xC6JFGldASHxtyKLy5Gbn4';
async function testModel() {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] })
  });
  if (!response.ok) {
    const txt = await response.text();
    console.error("Error:", txt);
  } else {
    const json = await response.json();
    console.log("Success:", json.candidates[0].content.parts[0].text);
  }
}
testModel();
