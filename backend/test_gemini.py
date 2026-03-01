import os, requests, json
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")
if model.startswith("models/"):
    model = model[len("models/"):]
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

payload = {
  "contents": [{"role":"user","parts":[{"text":"Return valid JSON: {\"ok\": true}"}]}],
  "generationConfig": {"responseMimeType":"application/json", "maxOutputTokens": 50}
}

r = requests.post(url, params={"key": key}, json=payload, timeout=30)
print("status:", r.status_code)
print(r.text[:2000])