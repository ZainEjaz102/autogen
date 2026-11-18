import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# TODO: expose your SelectorGroupChat team from multiagent.py as `team`
# (build it at module level, and keep Streamlit / asyncio.run code out of the import path).
from multiagent import team

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Task(BaseModel):
    task: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/run")
async def run(body: Task):
    async def stream():
        await team.reset()
        try:
            async for msg in team.run_stream(task=body.task):
                source = getattr(msg, "source", None)
                content = getattr(msg, "content", None)
                if source and source != "user" and isinstance(content, str) and content.strip():
                    yield json.dumps({"source": source, "content": content}) + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
