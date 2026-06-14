const fs = require('fs');
const path = require('path');

// Read API key from .env file manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GROQ_API_KEY=["']?([^"'\n]+)/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error("GROQ_API_KEY not found in .env");
  process.exit(1);
}

console.log("Found API Key:", apiKey.substring(0, 10) + "...");

const models = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant", 
  "llama-3.2-3b-preview",
  "llama-3.2-11b-vision-preview"
];

async function testModel(model) {
  console.log(`Testing model: ${model}...`);
  const requestBody = {
    model: model,
    messages: [
      { role: "system", content: "You are a helpful assistant. Output a JSON object with a 'status' field." },
      { role: "user", content: "Say hello." }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`- FAILED: ${response.status} - ${err}`);
      return false;
    }

    const data = await response.json();
    console.log(`- SUCCESS:`, data.choices[0]?.message?.content);
    return true;
  } catch (err) {
    console.error(`- ERROR:`, err.message);
    return false;
  }
}

async function run() {
  for (const model of models) {
    await testModel(model);
    console.log("--------------------------------------");
  }
}

run();
