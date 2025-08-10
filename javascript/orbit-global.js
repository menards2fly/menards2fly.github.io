async function sendToApiFreeLLM(prompt) {
  // If an ApiFreeLLM browser SDK is loaded and provides a chat function, use it
  if (window.apifree && typeof window.apifree.chat === 'function') {
    try {
      const sdkRes = await window.apifree.chat(prompt);
      return { text: normalizeLLMObject(sdkRes) };
    } catch (err) {
      console.warn('ApiFreeLLM SDK error:', err);
      throw err;
    }
  }

  // REST fallback (no key shown here). If you need auth, do via server proxy.
  try {
    const resp = await fetch('https://apifreellm.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`ApiFreeLLM REST error ${resp.status}: ${txt}`);
    }
    const data = await resp.json();
    return { text: normalizeLLMObject(data) };
  } catch (err) {
    console.warn('ApiFreeLLM REST error:', err);
    throw err;
  }
}

// ----------------- Helper: normalize whatever the LLM returns into a plain string -----------------
function normalizeLLMObject(obj) {
  console.log('🔍 Normalizing LLM response:', obj);
  if (!obj) return '';

  // If it's already a string, try parse JSON (some providers return JSON strings)
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      return normalizeLLMObject(parsed);
    } catch (e) {
      return obj;
    }
  }

  // Common direct fields
  if (typeof obj.response === 'string') return obj.response;
  if (typeof obj.text === 'string') return obj.text;
  if (typeof obj.reply === 'string') return obj.reply;

  // message / message.content styles
  if (typeof obj.message === 'string') return obj.message;
  if (obj.message && typeof obj.message.content === 'string') return obj.message.content;

  // content field
  if (typeof obj.content === 'string') return obj.content;

  // choices array (OpenAI-like)
  if (Array.isArray(obj.choices) && obj.choices.length) {
    const c = obj.choices[0];
    if (typeof c.text === 'string') return c.text;
    if (c.message && typeof c.message.content === 'string') return c.message.content;
  }

  // fallback: try to stringify relevant parts (keeps output readable)
  try {
    if (obj.data && typeof obj.data === 'string') return obj.data;
    if (typeof obj === 'object') return JSON.stringify(obj);
    return String(obj);
  } catch (e) {
    return String(obj);
  }
}

// GLOBAL SUMMARIZE FEATURE

export async function summarizePost(postText) {
  if (!postText.trim()) return 'No post content to summarize!';

  const instruction = 
    "Summarize the following post in 2-3 sentences in a friendly, clear tone:\n\n";

  const prompt = instruction + postText;

  try {
    const response = await sendToApiFreeLLM(prompt);
    return response.text.trim();
  } catch (err) {
    console.error('Error summarizing post:', err);
    return 'Oops, couldn’t summarize the post right now. Try again later!';
  }
}