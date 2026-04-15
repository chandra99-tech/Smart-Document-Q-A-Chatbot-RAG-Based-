"""
Embeddings service.
Defaults to BAAI/bge-large-en-v1.5 (free, local).
Set EMBEDDING_MODEL=text-embedding-3-large in .env to use OpenAI instead.
"""

import os
from typing import List
import numpy as np

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
_model = None          # lazy-loaded sentence-transformer
_openai_client = None  # lazy-loaded OpenAI client


def _is_openai_model(name: str) -> bool:
    return name.startswith("text-embedding")


def _get_local_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[Embedder] Loading local model: {EMBEDDING_MODEL} ...")
            _model = SentenceTransformer(EMBEDDING_MODEL)
            print(f"[Embedder] Model loaded successfully.")
        except Exception as e:
            print(f"[Embedder] CRITICAL ERROR loading model {EMBEDDING_MODEL}: {str(e)}")
            raise RuntimeError(f"Could not load embedding model: {e}")
    return _model


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"))
    return _openai_client


def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Embed a list of strings.
    Returns np.ndarray of shape (len(texts), embedding_dim).
    """
    if not texts:
        return np.array([])

    if _is_openai_model(EMBEDDING_MODEL):
        client = _get_openai_client()
        response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
        vectors = [item.embedding for item in response.data]
        return np.array(vectors, dtype=np.float32)
    else:
        model = _get_local_model()
        # BGE models benefit from a query prefix
        return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)


def embed_query(query: str) -> np.ndarray:
    """
    Embed a single query string.
    BGE uses a special prefix for queries.
    """
    if _is_openai_model(EMBEDDING_MODEL):
        return embed_texts([query])[0]
    else:
        model = _get_local_model()
        prefix = "Represent this sentence for searching relevant passages: "
        return model.encode([prefix + query], normalize_embeddings=True)[0]


def embedding_dim() -> int:
    """Return the embedding dimension of the current model."""
    dims = {
        "BAAI/bge-large-en-v1.5": 1024,
        "BAAI/bge-base-en-v1.5":  768,
        "text-embedding-3-large": 3072,
        "text-embedding-3-small": 1536,
        "text-embedding-ada-002": 1536,
    }
    return dims.get(EMBEDDING_MODEL, 1024)
