import re
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from config import GROQ_API_KEY, GROQ_CHAT_MODEL
from services.embedder_service import get_embedding
from services.supabase_service import search_similar_notes
from services.classifier_service import load_syllabus

logger = logging.getLogger("campuslore.agentic_rag")

def clean_llm_text(text: str) -> str:
    """Strips <think> tags or internal reasoning prefixes."""
    if not text:
        return ""
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    return cleaned.strip()

# 1. BILINGUAL INTENT & QUERY DECOMPOSER
def analyze_and_expand_query(query: str, active_week: int, course_id: str) -> Dict[str, Any]:
    """
    Agent Planning Step:
    - Detects student language style (English, Roman Urdu, or Code-Switch)
    - Determines if query is single-topic or cross-week comparative
    - Generates targeted technical sub-queries for multi-hop retrieval
    """
    if not GROQ_API_KEY:
        return {
            "language_mode": "bilingual_auto",
            "target_weeks": [active_week],
            "expanded_queries": [query, f"{query} implementation c++", f"{query} formula"],
            "reasoning": "Heuristic fallback"
        }
        
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        
        system_prompt = (
            "You are an academic query planner for engineering courses. "
            "Analyze the question and output a JSON block with this structure:\n"
            "```json\n"
            "{\n"
            '  "language_mode": "english" or "roman_urdu" or "bilingual_mixed",\n'
            '  "target_weeks": [5],\n'
            '  "expanded_queries": ["query 1", "query 2", "query 3"]\n'
            "}\n"
            "```"
        )
        
        user_msg = (
            f"Course: {course_id}, Active Week: {active_week}\n"
            f"Question: {query}"
        )
        
        resp = client.chat.completions.create(
            model=GROQ_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.1,
            max_tokens=350
        )
        
        raw_text = resp.choices[0].message.content or ""
        cleaned = clean_llm_text(raw_text)
        
        # Extract JSON using regex
        json_match = re.search(r'\{.*?\}', cleaned, re.DOTALL)
        if json_match:
            plan = json.loads(json_match.group(0))
        else:
            plan = {
                "language_mode": "bilingual_mixed",
                "target_weeks": [active_week],
                "expanded_queries": [query]
            }
            
        if not plan.get("target_weeks"):
            plan["target_weeks"] = [active_week]
        if not plan.get("expanded_queries"):
            plan["expanded_queries"] = [query]
            
        return plan
    except Exception as e:
        logger.error(f"Query expansion error: {e}")
        return {
            "language_mode": "bilingual_mixed",
            "target_weeks": [active_week],
            "expanded_queries": [query, f"{query} implementation", f"{query} concept"]
        }

# 2. MULTI-HOP VECTOR RETRIEVAL WITH DEDUPLICATION
def execute_multi_hop_retrieval(
    plan: Dict[str, Any],
    course_id: str,
    match_threshold: float = 0.20,
    max_total_sources: int = 5
) -> List[Dict[str, Any]]:
    target_weeks = plan.get("target_weeks", [1])
    queries = plan.get("expanded_queries", [])
    
    all_retrieved = []
    seen_chunk_keys = set()
    
    for q in queries:
        q_vec = get_embedding(q)
        for wk in target_weeks:
            results = search_similar_notes(
                query_embedding=q_vec,
                filter_week=wk,
                filter_course=course_id,
                match_threshold=match_threshold,
                match_count=3
            )
            for item in results:
                chunk_key = f"{item.get('file_name')}_{item.get('content', '')[:40]}"
                if chunk_key not in seen_chunk_keys:
                    seen_chunk_keys.add(chunk_key)
                    all_retrieved.append(item)
                    
    all_retrieved.sort(key=lambda x: x.get("similarity", 0), reverse=True)
    return all_retrieved[:max_total_sources]

# 3. SELF-RAG DOCUMENT GRADER
def grade_retrieval_relevance(query: str, sources: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    if not sources:
        return "EMPTY", []
    top_similarity = sources[0].get("similarity", 0)
    if top_similarity >= 0.40:
        return "HIGH", sources
    elif top_similarity >= 0.25:
        return "PARTIAL", sources
    else:
        return "LOW", sources

# 4. BILINGUAL GROUNDED GENERATOR
def generate_bilingual_agentic_response(
    query: str,
    plan: Dict[str, Any],
    sources: List[Dict[str, Any]],
    course_id: str,
    active_week: int
) -> str:
    language_mode = plan.get("language_mode", "bilingual_mixed")
    
    if sources:
        context_parts = []
        for idx, src in enumerate(sources, 1):
            context_parts.append(
                f"--- [Peer Note {idx} | File: {src.get('file_name', 'Note')} | Week: {src.get('week_number', active_week)} | Topic: {src.get('topic', 'General')} | Relevance: {src.get('similarity', 0):.2f}] ---\n"
                f"{src.get('content', '')}"
            )
        context_str = "\n\n".join(context_parts)
    else:
        context_str = "No specific peer notes found in the database for this topic yet."

    system_prompt = (
        "You are 'Senior AI', a top-ranking engineering senior and lab mentor at QUEST Nawabshah / MUET Jamshoro.\n"
        "Your mission is to help juniors understand core concepts, pass lab exams, and debug code based on their peers' notes.\n\n"
        "BILINGUAL ADAPTATION RULES:\n"
        "- If the student writes in English -> Respond in clear, professional technical English with structured bullet points and code.\n"
        "- If the student writes in Roman Urdu or Urdu-English mix -> Respond in warm, natural Roman Urdu combined with standard technical terms.\n"
        "- Grounding: Explicitly cite note names (e.g. 'From peer notes in circular_queue_lab.cpp...').\n"
        "- Code: Provide working C++/Python code snippets with comments and edge cases."
    )

    user_prompt = (
        f"STUDENT QUESTION:\n{query}\n\n"
        f"METADATA:\n"
        f"- Course: {course_id}\n"
        f"- Active Syllabus Week: {active_week}\n"
        f"- Language Mode: {language_mode}\n\n"
        f"RETRIEVED PEER NOTES CONTEXT:\n{context_str}\n\n"
        f"Provide your answer following the bilingual adaptation rules:"
    )

    if not GROQ_API_KEY:
        return f"Question: '{query}'. Retrieved {len(sources)} chunks."

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=GROQ_CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.25,
            max_tokens=650
        )
        raw_text = resp.choices[0].message.content or ""
        return clean_llm_text(raw_text)
    except Exception as e:
        logger.error(f"Agentic response generation failed: {e}")
        return f"Hamara AI abhi thoda busy hai. Please try again! (Error: {str(e)})"

# 5. MASTER AGENTIC PIPELINE
def run_agentic_rag(
    query: str,
    week_number: int,
    course_id: str = "CSE-212"
) -> Dict[str, Any]:
    start_time = time.time()
    plan = analyze_and_expand_query(query, week_number, course_id)
    sources = execute_multi_hop_retrieval(plan, course_id)
    grade, graded_sources = grade_retrieval_relevance(query, sources)
    
    if grade == "LOW" and len(plan.get("target_weeks", [])) == 1:
        expanded_weeks = [week_number]
        if week_number > 1: expanded_weeks.append(week_number - 1)
        if week_number < 16: expanded_weeks.append(week_number + 1)
        plan["target_weeks"] = expanded_weeks
        graded_sources = execute_multi_hop_retrieval(plan, course_id, match_threshold=0.18)
    
    answer = generate_bilingual_agentic_response(
        query=query,
        plan=plan,
        sources=graded_sources,
        course_id=course_id,
        active_week=week_number
    )
    
    latency = time.time() - start_time
    
    return {
        "answer": answer,
        "week_number": week_number,
        "course_id": course_id,
        "sources": graded_sources,
        "query": query,
        "agentic_meta": {
            "language_mode": plan.get("language_mode", "bilingual"),
            "expanded_queries": plan.get("expanded_queries", [query]),
            "relevance_grade": grade,
            "latency_seconds": round(latency, 2)
        }
    }
