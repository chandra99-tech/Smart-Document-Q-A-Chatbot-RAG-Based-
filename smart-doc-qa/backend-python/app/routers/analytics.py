from collections import Counter
from datetime import datetime, timedelta
from fastapi import APIRouter, Header

from app.utils.store import get_query_log, list_documents

router = APIRouter()


def _get_user_id(authorization: str = "") -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous"
    return authorization.split(" ", 1)[1][:32]


@router.get("")
def analytics(authorization: str = Header(default="")):
    user_id = _get_user_id(authorization)
    logs = get_query_log(user_id)
    docs = list_documents(user_id)

    total_queries   = len(logs)
    total_documents = len(docs)
    unanswered      = sum(1 for l in logs if not l["answered"])

    # Confidence distribution
    conf_counts = Counter(l["confidence"] for l in logs)
    total_conf  = max(total_queries, 1)
    conf_dist   = [
        {"name": "High",   "value": round(conf_counts.get("high",   0) / total_conf * 100)},
        {"name": "Medium", "value": round(conf_counts.get("medium", 0) / total_conf * 100)},
        {"name": "Low",    "value": round(conf_counts.get("low",    0) / total_conf * 100)},
    ]
    avg_confidence = conf_counts.get("high", 0) * 100 // max(total_queries, 1)

    # Queries over the last 7 days
    now    = datetime.utcnow()
    days   = [(now - timedelta(days=i)).date() for i in range(6, -1, -1)]
    by_day = Counter(l["ts"].date() for l in logs)
    queries_over_time = [
        {"date": d.strftime("%a"), "queries": by_day.get(d, 0)}
        for d in days
    ]

    # Top questions
    question_counts = Counter(l["question"] for l in logs)
    top_queries = [
        {"query": q[:60] + ("…" if len(q) > 60 else ""), "count": c}
        for q, c in question_counts.most_common(5)
    ]

    return {
        "totalQueries":    total_queries,
        "totalDocuments":  total_documents,
        "avgConfidence":   avg_confidence,
        "unanswered":      unanswered,
        "queriesOverTime": queries_over_time,
        "confidenceDist":  conf_dist,
        "topQueries":      top_queries,
    }
