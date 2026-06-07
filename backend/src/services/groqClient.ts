export async function generateGroqResponse(systemPrompt: string, userMessage: string, isJsonMode: boolean = false): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in the environment variables.");
  }

  const requestBody: any = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.2,
    max_completion_tokens: 4000
  };

  if (isJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

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
    console.error("Groq API Error:", err);
    throw new Error(`Failed to fetch from Groq API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (isJsonMode) {
    try {
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.substring(7);
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.substring(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
      }
      return JSON.parse(cleanedContent.trim());
    } catch (e) {
      console.error("Failed to parse Groq JSON response:", content);
      throw new Error("Groq returned malformed JSON");
    }
  }

  return content;
}
