# Agent Team UI (Next.js)

## Run locally
Backend (copy your multiagent.py into backend/, expose `team`):
    cd backend
    pip install -r requirements.txt   # plus autogen packages you already use
    uvicorn main:app --reload --port 8000

Frontend:
    npm install
    cp .env.example .env.local
    npm run dev    # http://localhost:3000

## Deploy
- Backend -> Railway: set GROQ_API_KEY and FRONTEND_URL (your Vercel URL).
  Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
- Frontend -> Vercel: set NEXT_PUBLIC_API_URL to your Railway URL.
