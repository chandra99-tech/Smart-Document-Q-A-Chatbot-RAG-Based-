from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Documents ──────────────────────────────────────────────────────────────────

class DocumentMeta(BaseModel):
    id: str
    filename: str
    file_type: str
    page_count: int
    chunk_count: int
    upload_date: datetime
    user_id: str
    size_bytes: int


class DocumentListResponse(BaseModel):
    documents: List[DocumentMeta]


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    message: str


# ── Chat ───────────────────────────────────────────────────────────────────────

class Source(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    content: str
    score: float = Field(..., ge=0.0, le=1.0)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    document_ids: Optional[List[str]] = None   # None → search all user docs
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    confidence: str           # "high" | "medium" | "low"
    session_id: str
    tokens_used: Optional[int] = None


class ChatMessage(BaseModel):
    id: str
    role: str                 # "user" | "assistant"
    content: str
    sources: Optional[List[Source]] = None
    confidence: Optional[str] = None
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessage]


class SessionMeta(BaseModel):
    id: str
    title: str
    created_at: datetime
    message_count: int


# ── Analytics ─────────────────────────────────────────────────────────────────

class QueryTrend(BaseModel):
    date: str
    queries: int


class TopQuery(BaseModel):
    query: str
    count: int


class ConfidenceDist(BaseModel):
    name: str
    value: float


class AnalyticsResponse(BaseModel):
    totalQueries: int
    totalDocuments: int
    avgConfidence: int
    unanswered: int
    queriesOverTime: List[QueryTrend]
    confidenceDist: List[ConfidenceDist]
    topQueries: List[TopQuery]
