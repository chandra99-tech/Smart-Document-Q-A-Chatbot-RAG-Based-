import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Header

from app.models.schemas import ChatRequest, ChatResponse, Source
from app.services.vector_store import get_store
from app.services.reranker import rerank
from app.services.llm import answer_question
from app.utils.store import (
    create_session, get_session, list_sessions, delete_session,
    add_message, get_messages, get_history_for_llm, log_query
)

router = APIRouter()

TOP_K_RETRIEVAL = 20
TOP_K_RERANK    = 5


def _get_user_id(authorization: str = "") -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous"
    return authorization.split(" ", 1)[1][:32]


@router.post("/ask", response_model=ChatResponse)
def ask(body: ChatRequest, authorization: str = Header(default="")):
    user_id = _get_user_id(authorization)
    session_id = body.session_id or str(uuid.uuid4())

    # Ensure session exists
    if not get_session(session_id):
        create_session(session_id, user_id, body.question[:60])

    # ── Step 1: Retrieve ─────────────────────────────────────────────────────
    store = get_store()
    candidates = store.search(
        query=body.question,
        top_k=TOP_K_RETRIEVAL,
        filter_document_ids=body.document_ids or None,
    )

    if not candidates:
        # No relevant chunks found
        add_message(session_id, "user", body.question)
        msg = add_message(
            session_id, "assistant",
            "I couldn't find any relevant information in the selected documents. "
            "Please make sure you've uploaded and selected the right documents.",
            confidence="low",
        )
        log_query(body.question, "low", False, user_id)
        return ChatResponse(
            answer=msg["content"],
            sources=[],
            confidence="low",
            session_id=session_id,
        )

    # ── Step 2: Re-rank ──────────────────────────────────────────────────────
    reranked = rerank(body.question, candidates, top_k=TOP_K_RERANK)

    # ── Step 3: Generate answer ──────────────────────────────────────────────
    history = get_history_for_llm(session_id)
    answer, confidence, tokens = answer_question(
        question=body.question,
        chunks=reranked,
        history=history,
    )

    # ── Step 4: Build source list ────────────────────────────────────────────
    seen = set()
    sources = []
    for chunk in reranked:
        key = (chunk["document_id"], chunk["page_number"])
        if key not in seen:
            seen.add(key)
            sources.append(Source(
                document_id=chunk["document_id"],
                document_name=chunk["document_name"],
                page_number=chunk["page_number"],
                content=chunk["content"],
                score=min(max(float(chunk["score"]), 0.0), 1.0),
            ))

    # ── Step 5: Persist conversation ─────────────────────────────────────────
    add_message(session_id, "user", body.question)
    add_message(session_id, "assistant", answer,
                sources=[s.dict() for s in sources], confidence=confidence)
    log_query(body.question, confidence, True, user_id)

    return ChatResponse(
        answer=answer,
        sources=sources,
        confidence=confidence,
        session_id=session_id,
        tokens_used=tokens,
    )


@router.get("/history/{session_id}")
def chat_history(session_id: str, authorization: str = Header(default="")):
    messages = get_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@router.get("/sessions")
def sessions(authorization: str = Header(default="")):
    user_id = _get_user_id(authorization)
    return list_sessions(user_id)


@router.delete("/sessions/{session_id}")
def remove_session(session_id: str, authorization: str = Header(default="")):
    if not delete_session(session_id):
        raise HTTPException(404, "Session not found.")
    return {"message": "Session deleted."}
