import pytest
import numpy as np
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from utils.chunker import semantic_chunk
from services.classifier_service import load_syllabus, heuristic_classify, classify_syllabus_week
from services.embedder_service import get_embedding, get_embeddings_batch
from services.rag_service import get_cache_key, build_system_prompt, execute_rag_pipeline
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# 1. CHUNKER AUDIT
def test_chunker_basic_and_overlap():
    short_text = "Short note about queues."
    chunks = semantic_chunk(short_text, max_chars=100, overlap=20)
    assert len(chunks) == 1
    assert chunks[0] == short_text

    long_text = """
    Circular Queue Implementation:
    In a circular queue, the last element is connected to the first element to form a circle.
    It solves the limitation of linear queue buffer overflow when front > 0 and rear == size-1.
    Enqueue: rear = (rear + 1) % capacity.
    Dequeue: front = (front + 1) % capacity.
    Condition for full: (rear + 1) % capacity == front.
    Condition for empty: front == -1 or front == rear.
    """
    chunks = semantic_chunk(long_text, max_chars=120, overlap=30)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) <= 150 # allow small margin for clean boundary

def test_chunker_empty_input():
    assert semantic_chunk("") == []
    assert semantic_chunk("   ") == []

# 2. SYLLABUS & CLASSIFIER AUDIT
def test_syllabus_loading():
    syllabi = load_syllabus()
    assert len(syllabi) >= 2
    course_ids = [c["course_id"] for c in syllabi]
    assert "CSE-212" in course_ids
    assert "CSE-305" in course_ids

def test_heuristic_classifier_accuracy():
    queue_note = "Enqueue and dequeue operations in circular queue using modulo arithmetic (rear + 1) % size"
    result = heuristic_classify(queue_note, course_id="CSE-212")
    assert result["assigned_week"] == 5
    assert "Queue" in result["topic"]

    graph_note = "Dijkstra algorithm for shortest path using adjacency matrix and BFS traversal"
    result = heuristic_classify(graph_note, course_id="CSE-212")
    assert result["assigned_week"] == 12
    assert "Graph" in result["topic"]

    subnet_note = "Subnetting calculations using CIDR slash notation /24 and finding usable hosts with subnet mask"
    result = heuristic_classify(subnet_note, course_id="CSE-305")
    assert result["assigned_week"] == 5
    assert "Subnetting" in result["topic"]

# 3. EMBEDDER DIMENSIONALITY & NORMALIZATION AUDIT
def test_embedder_dimensions_and_math():
    text1 = "Circular queue uses modulo operator for rear pointer reset"
    text2 = "FIFO buffer with front and rear pointers"
    text3 = "Photosynthesis in green plants"

    vec1 = get_embedding(text1)
    vec2 = get_embedding(text2)
    vec3 = get_embedding(text3)

    # Dimensionality check: BGE-small-en-v1.5 MUST be exactly 384 dimensions
    assert len(vec1) == 384
    assert len(vec2) == 384
    assert len(vec3) == 384

    # Normalization check: L2 norm should be ~1.0
    norm1 = np.linalg.norm(vec1)
    assert abs(norm1 - 1.0) < 1e-4

    # Semantic similarity check: Cosine similarity of vec1 and vec2 > vec1 and vec3
    sim_related = np.dot(vec1, vec2)
    sim_unrelated = np.dot(vec1, vec3)
    assert sim_related > sim_unrelated
    assert sim_related > 0.6  # High relevance for queue topics

def test_batch_embeddings():
    texts = ["Stack push pop", "Binary tree traversal", "TCP three way handshake"]
    vectors = get_embeddings_batch(texts)
    assert len(vectors) == 3
    for v in vectors:
        assert len(v) == 384

# 4. RAG SERVICE AUDIT
def test_system_prompt_structure():
    prompt = build_system_prompt()
    assert "QUEST Nawabshah" in prompt
    assert "Roman Urdu" in prompt
    assert "empathetic engineering senior" in prompt

def test_cache_key_generation():
    k1 = get_cache_key("Rear reset kab hota hai?", 5, "CSE-212")
    k2 = get_cache_key("  rear reset KAB HOTA HAI?  ", 5, "CSE-212")
    assert k1 == k2

# 5. FASTAPI ENDPOINTS AUDIT
def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_api_syllabus():
    res = client.get("/api/syllabus")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 2

def test_api_query_endpoint():
    res = client.post("/api/query", json={
        "query": "Circular queue rear reset formula",
        "week_number": 5,
        "course_id": "CSE-212"
    })
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert data["week_number"] == 5
    assert "sources" in data
