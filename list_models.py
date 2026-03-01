import os, requests, json

KEY = os.getenv("GEMINI_API_KEY")
url = "https://generativelanguage.googleapis.com/v1beta/models"
r = requests.get(url, params={"key": KEY}, timeout=30)
print("status:", r.status_code)
data = r.json()
print(json.dumps(data, indent=2)[:4000])  # prints first part

# optional: print only model names that support generateContent
for m in data.get("models", []):
    methods = m.get("supportedGenerationMethods", [])
    if "generateContent" in methods:
        print(m["name"])