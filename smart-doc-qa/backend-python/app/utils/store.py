"""
Lightweight in-memory store for documents, sessions, and messages.
In production, replace with PostgreSQL (via SQLAlchemy or asyncpg).
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import defaultdict

# ── In-memory tables ──────────────────────────────────────────────────────────

_documents:  Dict[str, Dict]             = {}   # doc_id → DocumentMeta dict
_sessions:   Dict[str, Dict]             = {}   # session_id → SessionMeta dict
_messages:   Dict[str, List[Dict]]       = defaultdict(list)  # session_id → [msg, ...]
_query_log:  List[Dict[str, Any]]        = []   # [{question, confidence, ts}, ...]


# ── Documents ─────────────────────────────────────────────────────────────────

def save_document(meta: Dict) -> None:
    _documents[meta["id"]] = meta


def get_document(doc_id: str) -> Optional[Dict]:
    return _documents.get(doc_id)


def list_documents(user_id: str) -> List[Dict]:
    return [d for d in _documents.values() if d.get("user_id") == user_id]


def delete_document(doc_id: str) -> bool:
    if doc_id in _documents:
        del _documents[doc_id]
        return True
    return False


# ── Sessions ──────────────────────────────────────────────────────────────────

def create_session(session_id: str, user_id: str, title: str = "New conversation") -> Dict:
    session = {
        "id": session_id,
        "user_id": user_id,
        "title": title,
        "created_at": datetime.utcnow(),
        "message_count": 0,
    }
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[Dict]:
    return _sessions.get(session_id)


def list_sessions(user_id: str) -> List[Dict]:
    return sorted(
        [s for s in _sessions.values() if s["user_id"] == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


def delete_session(session_id: str) -> bool:
    if session_id in _sessions:
        del _sessions[session_id]
        _messages.pop(session_id, None)
        return True
    return False


# ── Messages ──────────────────────────────────────────────────────────────────

def add_message(session_id: str, role: str, content: str,
                sources: Optional[List] = None, confidence: Optional[str] = None) -> Dict:
    msg = {
        "id": str(uuid.uuid4()),
        "role": role,
        "content": content,
        "sources": sources or [],
        "confidence": confidence,
        "created_at": datetime.utcnow(),
    }
    _messages[session_id].append(msg)
    if session_id in _sessions:
        _sessions[session_id]["message_count"] += 1
    return msg


def get_messages(session_id: str) -> List[Dict]:
    return _messages.get(session_id, [])


def get_history_for_llm(session_id: str) -> List[Dict[str, str]]:
    """Return conversation history in OpenAI format."""
    return [
        {"role": m["role"], "content": m["content"]}
        for m in _messages.get(session_id, [])
    ]


# ── Query log (for analytics) ─────────────────────────────────────────────────

def log_query(question: str, confidence: str, answered: bool, user_id: str):
    _query_log.append({
        "question": question,
        "confidence": confidence,
        "answered": answered,
        "user_id": user_id,
        "ts": datetime.utcnow(),
    })


def get_query_log(user_id: str) -> List[Dict]:
    return [q for q in _query_log if q["user_id"] == user_id]
