export async function sendToGemini(text, base64ImageData, onToken) {
    // 1. Grab the key from the environment
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    // 2. Build the URL for STREAMING with Server-Sent Events (alt=sse)
    const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

    const systemPrompt = "You are a helpful visual assistant. Your user is showing you a video feed and asking you questions. Answer their question based on what you see in the image. Be concise and descriptive.";

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
            {
                role: 'user',
                parts: [
                    { text },
                    { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }
                ]
            }
        ]
    }

    const response = await fetch(MODEL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    // --- NEW PRO DEBUGGING BLOCK ---
    if (!response.ok) {
        const errorData = await response.json();
        console.error("🔍 Detailed Google API Error:", errorData);
        throw new Error(`Google API Error ${response.status}: ${errorData?.error?.message || 'Check the console'}`);
    }
    // -------------------------------

    // 3. Read the continuous stream instead of waiting for a single JSON response
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the raw bytes into a string
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            // SSE chunks start with "data: "
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6); 
                
                // The stream sends "[DONE]" when it's finished
                if (dataStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(dataStr);
                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    if (textChunk) {
                        fullText += textChunk;
                        // Fire the callback every time a new piece of text arrives
                        if (onToken) onToken(textChunk, fullText);
                    }
                } catch{
                    // It's safe to ignore incomplete JSON chunks that might split across stream boundaries
                    console.warn("Skipped incomplete stream chunk");
                }
            }
        }
    }
    
    // Return the complete assembled text at the very end
    return fullText;
}