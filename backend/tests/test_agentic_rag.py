import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.agentic_rag_service import run_agentic_rag, analyze_and_expand_query

def test_query_expansion_and_intent():
    # Test Roman Urdu query
    plan_ur = analyze_and_expand_query("Yaar circular queue reset kab hota hai?", 5, "CSE-212")
    assert len(plan_ur["expanded_queries"]) >= 1
    
    # Test English query
    plan_en = analyze_and_expand_query("Explain Dijkstra shortest path time complexity and priority queue usage", 12, "CSE-212")
    assert len(plan_en["expanded_queries"]) >= 1

def test_bilingual_agentic_rag_execution():
    # 1. Test Roman Urdu Query
    res_ur = run_agentic_rag("Bhai circular queue ka wrap around condition samjha do", 5, "CSE-212")
    assert "answer" in res_ur
    assert "agentic_meta" in res_ur
    print("\n--- Roman Urdu Agentic Answer ---\n", res_ur["answer"])

    # 2. Test English Query
    res_en = run_agentic_rag("What is the time complexity of enqueue operation in circular queue?", 5, "CSE-212")
    assert "answer" in res_en
    print("\n--- English Agentic Answer ---\n", res_en["answer"])

if __name__ == "__main__":
    test_query_expansion_and_intent()
    test_bilingual_agentic_rag_execution()
    print("\n✅ Bilingual Agentic RAG Pipeline PASSED!")
