"""
Re-ranking layer.
Uses Cohere Rerank API (or falls back to a local cross-encoder model).
"""

import os
from typing import List, Dict, Any

COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

# Detect placeholder keys
PLACEHOLDER_KEYS = {"your_cohere_api_key_here", "INSERT_KEY_HERE", ""}
USE_LOCAL_RERANKER = COHERE_API_KEY in PLACEHOLDER_KEYS

if USE_LOCAL_RERANKER:
    print("[Reranker] No valid Cohere API key found. Using local Cross-Encoder fallback.")
else:
    print(f"[Reranker] Using Cohere API for re-ranking.")

_cohere_client = None
_cross_encoder  = None


def _get_cohere():
    global _cohere_client
    if _cohere_client is None:
        import cohere
        _cohere_client = cohere.Client(COHERE_API_KEY)
    return _cohere_client


def _get_cross_encoder():
    global _cross_encoder
    if _cross_encoder is None:
        from sentence_transformers import CrossEncoder
        print("[Reranker] Loading local cross-encoder model...")
        _cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _cross_encoder


def rerank(
    query: str,
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Re-rank candidate chunks by relevance to query.

    Args:
        query:      The user's question.
        candidates: List of dicts with at least 'content' and metadata keys.
        top_k:      Number of top results to return after reranking.

    Returns:
        Top-k candidates sorted by rerank score (descending).
    """
    if not candidates:
        return []

    top_k = min(top_k, len(candidates))
    documents = [c["content"] for c in candidates]

    if USE_LOCAL_RERANKER:
        # Cross-encoder: score each (query, passage) pair
        encoder = _get_cross_encoder()
        pairs   = [(query, doc) for doc in documents]
        scores  = encoder.predict(pairs)
        ranked  = sorted(
            zip(scores, candidates),
            key=lambda x: x[0],
            reverse=True,
        )
        results = []
        for score, candidate in ranked[:top_k]:
            results.append({**candidate, "score": float(score)})
        return results

    else:
        # Cohere Rerank API
        client   = _get_cohere()
        response = client.rerank(
            model="rerank-english-v2.0",
            query=query,
            documents=documents,
            top_n=top_k,
        )
        results = []
        for hit in response.results:
            candidate = candidates[hit.index]
            results.append({**candidate, "score": hit.relevance_score})
        return results
