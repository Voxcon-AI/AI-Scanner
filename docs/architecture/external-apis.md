# External APIs

## Google Gemini Vision API

- **Purpose:** Multimodal AI analysis of document images and extracted text for classification, entity extraction, and intelligent routing recommendations
- **Documentation:** https://ai.google.dev/docs/gemini_api_overview
- **Base URL(s):** `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`
- **Authentication:** API key in query parameter (`?key={GEMINI_API_KEY}`) or `x-goog-api-key` header (SDK handles automatically)
- **Rate Limits:** Free tier: 15 requests/minute, 1500 requests/day; Paid tier: 1000 requests/minute

**Key Endpoints Used:**
- `POST /v1/models/gemini-1.5-flash:generateContent` - Submit multimodal prompt (image + text) for analysis, receive structured JSON response with classification

**Integration Notes:**
- Use official `@google/generative-ai` Node.js SDK (handles retries, rate limiting)
- Configure `generation_config` for structured output: `response_mime_type: "application/json"`, `temperature: 0.2` (deterministic)
- Prompt engineering: Load template from `prompts/analysis-prompt.txt`, inject external data context (PO logs snippet, vendor list, folder structure)
- Error handling: Retry 3 times with exponential backoff (1s, 2s, 4s) on transient errors (500, 503), fail fast on client errors (400, 401)
- Cost optimization: Use Gemini 1.5 Flash (cheapest, fastest) for MVP; upgrade to Pro if accuracy issues
- Circuit breaker: After 3 consecutive API failures, pause requests for 60 seconds to avoid hammering failed endpoint

**Example Request (via SDK):**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2
  }
});

const result = await model.generateContent([
  { text: promptText }, // Includes context + instructions
  { inlineData: { data: imageBase64, mimeType: 'image/png' } }
]);

const analysis = JSON.parse(result.response.text());
```

---
