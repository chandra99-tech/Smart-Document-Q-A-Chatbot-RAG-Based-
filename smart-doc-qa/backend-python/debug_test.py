import os
import sys

# Add app to path
sys.path.append(os.getcwd())

try:
    print("Testing Embedder...")
    from app.services.embedder import embed_texts
    # Try a simple embedding
    vecs = embed_texts(["Hello world"])
    print(f"Embedding successful. Shape: {vecs.shape}")

    print("\nTesting Vector Store...")
    from app.services.vector_store import get_store
    store = get_store()
    print("Store initialized.")

    print("\nTesting Ingestion (mock)...")
    from app.services.chunker import Chunk
    chunk = Chunk(content="This is a test chunk", document_id="test", document_name="test.txt")
    store.add_chunks([chunk])
    print("Chunks added successfully.")

except Exception as e:
    print(f"\nERROR CAUGHT: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
