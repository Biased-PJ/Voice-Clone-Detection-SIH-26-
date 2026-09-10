import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import ping_db
from app.api import analyse, calls, auth

app = FastAPI(title="Teamrocket Backend")

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_extra_origins = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyse.router)

app.include_router(calls.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "team rocket backend running"}

@app.get("/health")
async def health():
    try:
        await ping_db()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}