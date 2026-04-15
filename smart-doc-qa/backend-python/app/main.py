from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import documents, chat, analytics

app = FastAPI(
    title="DocMind RAG API",
    description="Smart Document Q&A powered by RAG + DeepSeek",
    version="1.0.0"
)

# CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chat.router,      prefix="/chat",      tags=["Chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "docmind-rag"}
