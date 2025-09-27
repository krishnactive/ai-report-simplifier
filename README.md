# AI-Powered Medical Report Simplifier

## Problem Statement
This project implements ** AI-Powered Medical Report Simplifier**.

**Focus Area:** OCR → Test Extraction → Plain-Language Explanation  

The system takes medical reports (typed text or scanned image), extracts test results, normalizes them, and generates **patient-friendly explanations**.  

It handles:
- OCR errors (typos, formatting issues)
- Test normalization (names, units, reference ranges)
- Guardrails to prevent hallucinated tests
- Simple summaries without diagnosis

---

## Live Demo & Resources
- 🌍 **API (ngrok):** [API Link](https://stomatological-unadulteratedly-caitlin.ngrok-free.dev)  
- 📬 **Postman Collection:** [Postman Workspace](https://web.postman.co/workspace/My-Workspace~2b5fcb37-27fd-424c-8ae9-765ffb36ce4b/collection/35993315-9d7b0d12-d686-45b3-9093-e08395f1bd20?action=share&source=copy-link&creator=35993315)  
- 💻 **GitHub Repository:** [ai-report-simplifier](https://github.com/krishnactive/ai-report-simplifier)  

---

## Architecture

1. **Step 1 – OCR / Extraction**  
   - Input: text or scanned image  
   - AI + heuristics clean OCR output  
   - Output: raw test lines  

2. **Step 2 – Normalization**  
   - Maps tests to standard names/units  
   - Assigns `status` (low / normal / high / borderline)  
   - Attaches reference ranges  

3. **Step 3 – Summary**  
   - AI generates patient-friendly explanations  
   - No diagnosis, only plain-language descriptions  
   - Guardrails prevent hallucinated tests  

4. **Step 4 – Final Output**  
   - Combines normalized tests and summary into a single JSON  

---

## Tech Stack
- **Backend:** Node.js (Express, ES Modules)  
- **OCR:** Tesseract.js  
- **AI:** Google Gemini (`@google/generative-ai`)  
- **Upload handling:** Multer  
- **Config:** dotenv  

---

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/krishnactive/ai-report-simplifier.git
cd ai-report-simplifier
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file:
```
PORT=5000
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 4. Run Server
```bash
npm run dev   # development with hot reload
npm start     # production
```

Server runs at → `http://localhost:5000`

### 5. Expose with ngrok
```bash
npx ngrok http 5000
```

Forwarding URL example:  
```
https://stomatological-unadulteratedly-caitlin.ngrok-free.dev
```

---

## API Endpoints

### 1. `POST /extract`
Extract raw test lines from text or image.

#### Request (JSON):
```json
{
  "data": "CBC: Hemglobin 10.2 g/dL (Low), WBC 11200 /uL (Hgh)"
}
```

#### Response:
```json
{
  "tests_raw": [
    "Hemoglobin 10.2 g/dL (Low)",
    "WBC 11200 /uL (High)"
  ],
  "confidence": 0.80
}
```

---

### 2. `POST /normalize`
Normalize test values, units, and statuses.

#### Request:
```json
{
  "tests_raw": [
    "Hemoglobin 10.2 g/dL (Low)",
    "WBC 11200 /uL (High)"
  ]
}
```

#### Response:
```json
{
  "tests": [
    {
      "name": "Hemoglobin",
      "value": 10.2,
      "unit": "g/dL",
      "status": "low",
      "ref_range": { "low": 12.0, "high": 15.0 }
    },
    {
      "name": "WBC",
      "value": 11200,
      "unit": "/uL",
      "status": "high",
      "ref_range": { "low": 4000, "high": 11000 }
    }
  ],
  "normalization_confidence": 0.84
}
```

---

### 3. `POST /summarize`
Generate a plain-language summary of test findings.

#### Request:
```json
{
  "tests": [
    { "name": "Hemoglobin", "value": 10.2, "unit": "g/dL", "status": "low" },
    { "name": "WBC", "value": 11200, "unit": "/uL", "status": "high" }
  ]
}
```

#### Response:
```json
{
  "summary": "Low hemoglobin and high white blood cell count.",
  "explanations": [
    "Low hemoglobin may relate to anemia.",
    "High WBC can occur with infections."
  ]
}
```

---

### 4. `POST /process`
Runs the full pipeline: **extract → normalize → summarize**.

#### Request:
```json
{
  "data": "CBC: Hemglobin 10.2 g/dL (Low), WBC 11200 /uL (Hgh)"
}
```

#### Response:
```json
{
  "tests": [
    {
      "name": "Hemoglobin",
      "value": 10.2,
      "unit": "g/dL",
      "status": "low",
      "ref_range": { "low": 12.0, "high": 15.0 }
    },
    {
      "name": "WBC",
      "value": 11200,
      "unit": "/uL",
      "status": "high",
      "ref_range": { "low": 4000, "high": 11000 }
    }
  ],
  "summary": "Low hemoglobin and high white blood cell count.",
  "explanations": [
    "Low hemoglobin may relate to anemia.",
    "High WBC can occur with infections."
  ],
  "status": "ok"
}
```

---

## Guardrails

If hallucinated or unknown tests appear, service returns:
```json
{ "status": "unprocessed", "reason": "hallucinated tests not present in input" }
```

---

## Testing with curl

```bash
curl -X POST https://stomatological-unadulteratedly-caitlin.ngrok-free.dev/extract   -H "Content-Type: application/json"   -d '{"data":"CBC: Hemglobin 10.2 g/dL (Low), WBC 11200 /uL (Hgh)"}'

curl -X POST https://stomatological-unadulteratedly-caitlin.ngrok-free.dev/normalize   -H "Content-Type: application/json"   -d '{"tests_raw":["Hemoglobin 10.2 g/dL (Low)","WBC 11200 /uL (High)"]}'

curl -X POST https://stomatological-unadulteratedly-caitlin.ngrok-free.dev/summarize   -H "Content-Type: application/json"   -d '{"tests":[{"name":"Hemoglobin","value":10.2,"unit":"g/dL","status":"low"},{"name":"WBC","value":11200,"unit":"/uL","status":"high"}]}'

curl -X POST https://stomatological-unadulteratedly-caitlin.ngrok-free.dev/process   -H "Content-Type: application/json"   -d '{"data":"CBC: Hemglobin 10.2 g/dL (Low), WBC 11200 /uL (Hgh)"}'
```

---

## Submission Checklist ✅
- [x] Working backend demo (local + ngrok)  
- [x] GitHub repository with code and README  
- [x] Sample curl/Postman requests included  
- [x] Guardrails implemented  
- [x] AI + OCR integrated  
- [x] Screen recording required for submission  

---

## License
MIT
