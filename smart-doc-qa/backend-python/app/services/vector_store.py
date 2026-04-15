"""
Vector store abstraction.
Switch backends via VECTOR_DB env var: faiss | chroma | pinecone
"""

import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

from app.services.chunker import Chunk
from app.services.embedder import embed_texts, embed_query, embedding_dim

VECTOR_DB      = os.getenv("VECTOR_DB", "faiss")
FAISS_PATH     = os.getenv("FAISS_INDEX_PATH", "./faiss_index")
CHROMA_DIR     = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")


# ── FAISS backend ─────────────────────────────────────────────────────────────

class FaissStore:
    def __init__(self, index_path: str = FAISS_PATH):
        import faiss
        self.faiss = faiss
        self.index_path = Path(index_path)
        self.index_path.mkdir(parents=True, exist_ok=True)
        self.dim = embedding_dim()
        self._load_or_create()

    def _index_file(self):
        return self.index_path / "index.faiss"

    def _meta_file(self):
        return self.index_path / "metadata.pkl"

    def _load_or_create(self):
        if self._index_file().exists():
            self.index = self.faiss.read_index(str(self._index_file()))
            with open(self._meta_file(), "rb") as f:
                self.metadata: List[Dict] = pickle.load(f)
        else:
            self.index = self.faiss.IndexFlatIP(self.dim)   # Inner-product (cosine after normalise)
            self.metadata = []

    def _save(self):
        self.faiss.write_index(self.index, str(self._index_file()))
        with open(self._meta_file(), "wb") as f:
            pickle.dump(self.metadata, f)

    def add_chunks(self, chunks: List[Chunk]):
        texts  = [c.content for c in chunks]
        vectors = embed_texts(texts).astype(np.float32)
        self.faiss.normalize_L2(vectors)
        self.index.add(vectors)
        for c in chunks:
            self.metadata.append(c.to_dict())
        self._save()

    def search(
        self,
        query: str,
        top_k: int = 20,
        filter_document_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        qvec = embed_query(query).astype(np.float32).reshape(1, -1)
        self.faiss.normalize_L2(qvec)
        k = min(top_k * 3, self.index.ntotal) if filter_document_ids else top_k
        if k == 0:
            return []
        scores, indices = self.index.search(qvec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            meta = self.metadata[idx]
            if filter_document_ids and meta["document_id"] not in filter_document_ids:
                continue
            results.append({**meta, "score": float(score)})
            if len(results) == top_k:
                break
        return results

    def delete_document(self, document_id: str):
        """Rebuild index without the given document_id."""
        keep_indices = [i for i, m in enumerate(self.metadata) if m["document_id"] != document_id]
        if not keep_indices:
            self.index = self.faiss.IndexFlatIP(self.dim)
            self.metadata = []
        else:
            keep_meta = [self.metadata[i] for i in keep_indices]
            texts = [m["content"] for m in keep_meta]
            vectors = embed_texts(texts).astype(np.float32)
            self.faiss.normalize_L2(vectors)
            self.index = self.faiss.IndexFlatIP(self.dim)
            self.index.add(vectors)
            self.metadata = keep_meta
        self._save()


# ── Chroma backend ────────────────────────────────────────────────────────────

class ChromaStore:
    def __init__(self, persist_dir: str = CHROMA_DIR):
        import chromadb
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="docmind",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(self, chunks: List[Chunk]):
        texts     = [c.content for c in chunks]
        ids       = [c.chunk_id for c in chunks]
        metadatas = [c.to_dict() for c in chunks]
        embeddings = embed_texts(texts).tolist()
        self.collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)

    def search(
        self,
        query: str,
        top_k: int = 20,
        filter_document_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        qvec = embed_query(query).tolist()
        where = {"document_id": {"$in": filter_document_ids}} if filter_document_ids else None
        result = self.collection.query(
            query_embeddings=[qvec],
            n_results=top_k,
            where=where,
        )
        hits = []
        for i, doc_id in enumerate(result["ids"][0]):
            meta  = result["metadatas"][0][i]
            score = 1 - result["distances"][0][i]   # cosine similarity
            hits.append({**meta, "score": score})
        return hits

    def delete_document(self, document_id: str):
        self.collection.delete(where={"document_id": document_id})


# ── Factory ───────────────────────────────────────────────────────────────────

_store = None

def get_store():
    global _store
    if _store is None:
        if VECTOR_DB == "chroma":
            _store = ChromaStore()
        else:
            _store = FaissStore()
    return _store
