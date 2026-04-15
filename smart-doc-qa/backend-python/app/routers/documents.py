import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import JSONResponse

from app.services.chunker import ingest_document
from app.services.vector_store import get_store
from app.utils.store import save_document, list_documents, delete_document, get_document

router = APIRouter()
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".txt", ".png", ".jpg", ".jpeg"}
MAX_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", 50)) * 1024 * 1024


def _get_user_id(authorization: str = "") -> str:
    """Extract user_id from Bearer token. In production, validate JWT properly."""
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous"
    return authorization.split(" ", 1)[1][:32]   # use token prefix as mock user_id


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(default=""),
):
    user_id = _get_user_id(authorization)
    ext = Path(file.filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type '{ext}' is not supported.")

    # Save to disk
    doc_id    = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{doc_id}{ext}"
    content   = await file.read()

    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(413, "File exceeds the 50 MB limit.")

    with open(save_path, "wb") as f:
        f.write(content)

    # Parse + chunk
    try:
        chunks = ingest_document(
            file_path=str(save_path),
            document_id=doc_id,
            document_name=file.filename,
        )
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(422, f"Failed to process document: {e}")

    # Embed + store
    try:
        print(f"[Documents] Initializing vector store for document: {doc_id}")
        store = get_store()
        
        print(f"[Documents] Adding {len(chunks)} chunks to vector store...")
        store.add_chunks(chunks)
        print(f"[Documents] Successfully indexed document: {doc_id}")

        # Persist metadata
        meta = {
            "id": doc_id,
            "filename": file.filename,
            "file_type": ext.lstrip("."),
            "page_count": chunks[-1].page_number if chunks else 0,
            "chunk_count": len(chunks),
            "upload_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "size_bytes": len(content),
        }
        save_document(meta)
    except Exception as e:
        print(f"[Documents] ERROR during indexing: {str(e)}")
        # Clean up file if indexing failed
        save_path.unlink(missing_ok=True)
        raise HTTPException(500, f"Indexing failed: {str(e)}")

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "chunk_count": len(chunks),
        "message": "Document uploaded and indexed successfully.",
    }


@router.get("")
def get_documents(authorization: str = Header(default="")):
    user_id = _get_user_id(authorization)
    return list_documents(user_id)


@router.delete("/{doc_id}")
def remove_document(doc_id: str, authorization: str = Header(default="")):
    user_id = _get_user_id(authorization)
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    if doc["user_id"] != user_id:
        raise HTTPException(403, "Access denied.")

    # Remove from vector store
    store = get_store()
    store.delete_document(doc_id)

    # Remove file
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOAD_DIR / f"{doc_id}{ext}"
        if p.exists():
            p.unlink()
            break

    delete_document(doc_id)
    return {"message": "Document deleted."}
