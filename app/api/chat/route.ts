
import { NextRequest, NextResponse } from "next/server";


// This API route receives the chat messages and prompt from the frontend
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Chat API received:", JSON.stringify(body).slice(0, 200));
  const { messages, prompt, transcript } = body;
  const apiKey = process.env.GROQ_API_KEY;
  
  
  // If a custom prompt is provided, use it. Otherwise, use a default system prompt
  const systemPrompt = prompt
    ? `${prompt}\n\nTranscript so far:\n${transcript}`
    : `You are a smart meeting assistant.\n\nTranscript so far:\n${transcript}`;
  
  
    if (!messages || !apiKey) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  

  try {

    // Call the Groq API 
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 1000,
        temperature: 0.7,
        stream : true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });
    
    // If the API call fails, return the error message and status code
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }


    return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}