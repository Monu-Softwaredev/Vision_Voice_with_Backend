// // src/api/gemini.js
// // Simple helper to send text + base64 image to backend
// export async function sendToGemini(text, base64Image) {
//   try {
//     const res = await fetch("/api/gemini", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text, image: base64Image }),
//     });

//     // Try parse JSON (backend proxies Gemini response)
//     const json = await res.json();
//     if (!res.ok) {
//       // Attach backend message if available
//       const errMsg = json?.error || json?.message || `HTTP ${res.status}`;
//       throw new Error(errMsg);
//     }

//     return json;
//   } catch (err) {
//     console.error("sendToGemini error:", err);
//     throw err;
//   }
// }
