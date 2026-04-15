"""
LLM service using DeepSeek (OpenAI-compatible).
Handles prompt construction, conversation memory, and confidence scoring.
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI

DEEPSEEK_API_KEY  = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

_client: Optional[OpenAI] = None

def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    return _client


SYSTEM_PROMPT = """You are DocMind, an intelligent document Q&A assistant.

Rules:
1. Answer ONLY using information from the provided context below.
2. If the context does not contain enough information, clearly say: "I don't have enough information in the provided documents to answer this question."
3. Always cite your sources using the format: [Source: <document_name>, Page <page_number>].
4. Format your answer clearly — use bullet points or numbered lists when listing multiple items.
5. Be concise but complete. Do not pad your answer.
6. At the END of your answer, on a new line, output exactly one of:
   CONFIDENCE: high | CONFIDENCE: medium | CONFIDENCE: low
   (Choose based on how well the context supports your answer.)

Context:
{context}
"""


def _build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Document: {chunk['document_name']} | Page: {chunk['page_number']}\n"
            f"{chunk.get('parent_content') or chunk['content']}"
        )
    return "\n\n---\n\n".join(parts)


def _extract_confidence(answer: str) -> Tuple[str, str]:
    """
    Strip the trailing CONFIDENCE line from the answer.
    Returns (clean_answer, confidence_level).
    """
    lines = answer.strip().splitlines()
    confidence = "medium"
    clean_lines = []
    for line in lines:
        stripped = line.strip().upper()
        if stripped.startswith("CONFIDENCE:"):
            level = stripped.split(":", 1)[1].strip().lower()
            if level in ("high", "medium", "low"):
                confidence = level
        else:
            clean_lines.append(line)
    return "\n".join(clean_lines).strip(), confidence


def answer_question(
    question: str,
    chunks: List[Dict[str, Any]],
    history: Optional[List[Dict[str, str]]] = None,
    model: str = "deepseek-chat",
) -> Tuple[str, str, int]:
    """
    Call DeepSeek to answer a question given relevant chunks.

    Args:
        question: The user's question.
        chunks:   Re-ranked context chunks.
        history:  Prior conversation turns [{"role": ..., "content": ...}].
        model:    DeepSeek model name.

    Returns:
        (answer, confidence, tokens_used)
    """
    client  = _get_client()
    context = _build_context(chunks)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
    ]

    # Inject summarised history (last 6 turns to stay within context limit)
    if history:
        messages.extend(history[-6:])

    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.1,
        max_tokens=1024,
    )

    raw_answer   = response.choices[0].message.content or ""
    tokens_used  = response.usage.total_tokens if response.usage else 0
    answer, conf = _extract_confidence(raw_answer)

    return answer, conf, tokens_used
