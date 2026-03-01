# Safe commit checklist (no API key leaks)

Before committing:

1. **Never commit `.env`** — It is in `.gitignore`, so `git add .` will not stage it. Only `.env.example` (no real values) should be committed.

2. **Verify what will be committed:**
   ```powershell
   git add .
   git status
   ```
   Confirm **`.env` does NOT appear** in the list. You should see `.env.example` but not `.env`.

3. **Optional check:** Run `git diff --cached --name-only` and ensure no file path contains `.env` except `.env.example`.

4. **Commit:**
   ```powershell
   git commit -m "Your message"
   ```

Code only reads keys via `os.getenv(...)`; no keys are hardcoded. Keep real keys only in `.env` (local, never committed).
