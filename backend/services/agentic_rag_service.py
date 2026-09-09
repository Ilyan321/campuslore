import re
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from config import GROQ_API_KEY, GROQ_CHAT_MODEL
from services.embedder_service import get_embedding, get_embeddings_batch
from services.supabase_service import search_similar_notes
from services.classifier_service import load_syllabus, heuristic_classify

logger = logging.getLogger("campuslore.agentic_rag")

def clean_llm_text(text: str) -> str:
    """Strips <think> tags, unclosed think blocks, or internal reasoning prefixes."""
    if not text:
        return ""
    # Strip closed <think>...</think> blocks
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Strip unclosed <think> block if token limit cutoff occurred
    if '<think>' in cleaned:
        cleaned = re.sub(r'<think>.*', '', cleaned, flags=re.DOTALL)
    return cleaned.strip()

# 1. BILINGUAL INTENT & AUTONOMOUS SYLLABUS ROUTER
def analyze_and_expand_query(
    query: str,
    active_week: Optional[int] = None,
    course_id: str = "CSE-212"
) -> Dict[str, Any]:
    """
    Agent Planning Step:
    - Autonomously detects the syllabus week if student hasn't selected one
    - Detects language style (English, Roman Urdu, or Code-Switch)
    - Generates targeted technical sub-queries for multi-hop retrieval
    """
    syllabi = load_syllabus()
    syllabus_context = [
        {"week": w["week"], "topic": w["core_topic"], "keywords": w.get("grounding_keywords", [])}
        for c in syllabi if c["course_id"] == course_id for w in c.get("syllabus_timeline", [])
    ]
    
    # If active_week is not provided or 0, use heuristic mapping first as a seed
    auto_detected_week = active_week
    if not auto_detected_week or auto_detected_week <= 0:
        heuristic_res = heuristic_classify(query, course_id)
        auto_detected_week = heuristic_res.get("assigned_week", 1)

    if not GROQ_API_KEY:
        return {
            "language_mode": "bilingual_auto",
            "target_weeks": [auto_detected_week],
            "primary_week": auto_detected_week,
            "expanded_queries": [query, f"{query} implementation c++", f"{query} formula"],
            "reasoning": "Heuristic fallback"
        }
        
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        
        system_prompt = (
            "You are an intelligent academic router and query planner for university engineering courses.\n"
            "Analyze the student's question and syllabus timeline.\n"
            "Determine the EXACT syllabus week number this question belongs to (or multiple weeks if comparative).\n"
            "Output a JSON block with this structure:\n"
            "```json\n"
            "{\n"
            '  "language_mode": "english" or "roman_urdu" or "bilingual_mixed",\n'
            '  "primary_week": 5,\n'
            '  "target_weeks": [5],\n'
            '  "detected_topic": "Topic Name",\n'
            '  "expanded_queries": ["query 1 (technical English)", "query 2 (implementation)", "query 3 (edge cases)"],\n'
            '  "is_comparative": false\n'
            "}\n"
            "```"
        )
        
        user_msg = (
            f"Course: {course_id}\n"
            f"User Active Week Context: {active_week or 'AUTO-DETECT (User did not specify a week)'}\n"
            f"Syllabus Timeline Reference: {json.dumps(syllabus_context)}\n"
            f"Student Question: {query}"
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
        
        json_match = re.search(r'\{.*?\}', cleaned, re.DOTALL)
        if json_match:
            plan = json.loads(json_match.group(0))
        else:
            plan = {
                "language_mode": "bilingual_mixed",
                "primary_week": auto_detected_week,
                "target_weeks": [auto_detected_week],
                "expanded_queries": [query]
            }
            
        if not plan.get("primary_week"):
            plan["primary_week"] = auto_detected_week
        if not plan.get("target_weeks"):
            plan["target_weeks"] = [plan["primary_week"]]
        if not plan.get("expanded_queries"):
            plan["expanded_queries"] = [query]
            
        return plan
    except Exception as e:
        logger.error(f"Query analysis error: {e}")
        return {
            "language_mode": "bilingual_mixed",
            "primary_week": auto_detected_week,
            "target_weeks": [auto_detected_week],
            "expanded_queries": [query, f"{query} implementation", f"{query} concept"]
        }

# 2. BATCH VECTOR RETRIEVAL + RECIPROCAL RANK FUSION (RRF)
def execute_rrf_retrieval(
    plan: Dict[str, Any],
    course_id: str,
    match_threshold: float = 0.18,
    max_total_sources: int = 5,
    rrf_k: int = 60
) -> List[Dict[str, Any]]:
    """
    Optimized Retrieval Engine:
    1. Batch computes embeddings for all expanded sub-queries in 1 matrix pass.
    2. Runs vector similarity across target weeks.
    3. Reranks candidate note chunks using Reciprocal Rank Fusion (RRF).
    """
    target_weeks = plan.get("target_weeks", [1])
    queries = plan.get("expanded_queries", [])
    if not queries:
        return []

    # Batch embedding (1 matrix operation instead of sequential loop)
    query_vectors = get_embeddings_batch(queries)
    
    # Candidate pool: chunk_id -> (chunk_dict, rrf_score, max_sim)
    candidate_scores: Dict[str, Dict[str, Any]] = {}
    
    for q_idx, q_vec in enumerate(query_vectors):
        for wk in target_weeks:
            results = search_similar_notes(
                query_embedding=q_vec,
                filter_week=wk,
                filter_course=course_id,
                match_threshold=match_threshold,
                match_count=4
            )
            for rank, item in enumerate(results, start=1):
                chunk_id = f"{item.get('file_name')}_{item.get('content', '')[:50]}"
                rrf_increment = 1.0 / (rrf_k + rank)
                
                if chunk_id not in candidate_scores:
                    item_copy = dict(item)
                    candidate_scores[chunk_id] = {
                        "chunk": item_copy,
                        "rrf_score": rrf_increment,
                        "max_sim": item.get("similarity", 0)
                    }
                else:
                    candidate_scores[chunk_id]["rrf_score"] += rrf_increment
                    if item.get("similarity", 0) > candidate_scores[chunk_id]["max_sim"]:
                        candidate_scores[chunk_id]["max_sim"] = item.get("similarity", 0)
                        
    # Sort candidates by combined RRF score
    ranked = sorted(candidate_scores.values(), key=lambda x: x["rrf_score"], reverse=True)
    
    final_sources = []
    for entry in ranked[:max_total_sources]:
        chunk_obj = entry["chunk"]
        chunk_obj["similarity"] = round(entry["max_sim"], 3)
        chunk_obj["rrf_score"] = round(entry["rrf_score"], 4)
        final_sources.append(chunk_obj)
        
    return final_sources

# 3. SELF-RAG DOCUMENT RELEVANCE GRADER
def grade_retrieval_relevance(query: str, sources: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    if not sources:
        return "EMPTY", []
    top_sim = sources[0].get("similarity", 0)
    if top_sim >= 0.40:
        return "HIGH", sources
    elif top_sim >= 0.22:
        return "PARTIAL", sources
    else:
        return "LOW", sources

# 4. BILINGUAL GROUNDED SYNTHESIS PROMPT BUILDER
def build_bilingual_synthesis_prompt(
    query: str,
    plan: Dict[str, Any],
    sources: List[Dict[str, Any]],
    course_id: str
) -> Tuple[str, str]:
    language_mode = plan.get("language_mode", "bilingual_mixed")
    primary_week = plan.get("primary_week", 1)
    
    if sources:
        context_parts = []
        for idx, src in enumerate(sources, 1):
            context_parts.append(
                f"--- [Peer Note {idx} | File: {src.get('file_name', 'Note')} | Week: {src.get('week_number', primary_week)} | Topic: {src.get('topic', 'General')} | Relevance: {src.get('similarity', 0):.2f}] ---\n"
                f"{src.get('content', '')}"
            )
        context_str = "\n\n".join(context_parts)
    else:
        context_str = "No specific peer notes found in database for this exact topic yet."

    system_prompt = (
        "You are CampusLore Senior AI, a precise, highly knowledgeable engineering senior and academic mentor.\n"
        "Your mission is to guide students through difficult engineering concepts, lab practicals, viva questions, and exam preparation.\n\n"
        "COMMUNICATION RULES:\n"
        "- Default Language: Respond in clear, structured, technical English with clean markdown and formatted code blocks.\n"
        "- If the student explicitly queries in Roman Urdu -> Adapt and explain technical concepts in accessible Roman Urdu.\n"
        "- Grounding: Strictly ground explanations in the verified senior peer notes provided.\n"
        "- Code: Provide working, commented code snippets with time/space complexity and common edge cases.\n"
        "- Output Format: Clean, direct markdown only. Never output internal reasoning or think tags."
    )

    user_prompt = (
        f"STUDENT QUESTION:\n{query}\n\n"
        f"AGENTIC ROUTER METADATA:\n"
        f"- Target Course: {course_id}\n"
        f"- Auto-Detected Syllabus Week: Week {primary_week}\n"
        f"- Language Mode: {language_mode}\n\n"
        f"GROUNDED PEER CONTEXT:\n{context_str}\n\n"
        f"Provide a comprehensive, bilingual-adapted answer:"
    )
    
    return system_prompt, user_prompt

# 5. MASTER AGENTIC PIPELINE (Sync & Stream)
def run_agentic_rag(
    query: str,
    week_number: Optional[int] = None,
    course_id: str = "CSE-212"
) -> Dict[str, Any]:
    start_time = time.time()
    
    # Step 1: Autonomous Analysis & Week Discovery
    plan = analyze_and_expand_query(query, week_number, course_id)
    primary_week = plan.get("primary_week", 1)
    
    # Step 2: Batch Embedding + RRF Reranking
    sources = execute_rrf_retrieval(plan, course_id)
    
    # Step 3: Self-RAG Document Grader
    grade, graded_sources = grade_retrieval_relevance(query, sources)
    
    # If low relevance and only 1 week searched, expand search to adjacent weeks
    if grade == "LOW" and len(plan.get("target_weeks", [])) == 1:
        logger.info("Low relevance detected. Expanding search to adjacent syllabus weeks...")
        expanded = [primary_week]
        if primary_week > 1: expanded.append(primary_week - 1)
        if primary_week < 16: expanded.append(primary_week + 1)
        plan["target_weeks"] = expanded
        graded_sources = execute_rrf_retrieval(plan, course_id, match_threshold=0.15)
        
    # Step 4: Bilingual Synthesis
    sys_prompt, user_prompt = build_bilingual_synthesis_prompt(query, plan, graded_sources, course_id)
    
    if not GROQ_API_KEY:
        answer = f"**[Demo Mode]** Question received: '{query}'. Auto-routed to Week {primary_week}."
    else:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            resp = client.chat.completions.create(
                model=GROQ_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.25,
                max_tokens=650
            )
            raw_text = resp.choices[0].message.content or ""
            answer = clean_llm_text(raw_text)
        except Exception as e:
            logger.error(f"Agentic inference error: {e}")
            answer = f"Hamara AI abhi busy hai. Please try again! (Error: {str(e)})"

    latency = time.time() - start_time
    
    return {
        "answer": answer,
        "week_number": primary_week,
        "course_id": course_id,
        "sources": graded_sources,
        "query": query,
        "agentic_meta": {
            "auto_detected_week": primary_week,
            "detected_topic": plan.get("detected_topic"),
            "language_mode": plan.get("language_mode", "bilingual"),
            "expanded_queries": plan.get("expanded_queries", [query]),
            "relevance_grade": grade,
            "latency_seconds": round(latency, 2)
        }
    }

async def stream_agentic_rag(
    query: str,
    week_number: Optional[int] = None,
    course_id: str = "CSE-212"
) -> AsyncGenerator[str, None]:
    """
    Streams Agentic RAG tokens with Server-Sent Events (SSE).
    """
    plan = analyze_and_expand_query(query, week_number, course_id)
    primary_week = plan.get("primary_week", 1)
    sources = execute_rrf_retrieval(plan, course_id)
    sys_prompt, user_prompt = build_bilingual_synthesis_prompt(query, plan, sources, course_id)

    if not GROQ_API_KEY:
        yield f"data: {json.dumps({'type': 'token', 'content': 'GROQ_API_KEY not configured.'})}\n\n"
        return

    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    
    # Emit metadata event first
    meta_event = {
        "type": "meta",
        "auto_detected_week": primary_week,
        "language_mode": plan.get("language_mode", "bilingual"),
        "sources": sources
    }
    yield f"data: {json.dumps(meta_event)}\n\n"

    stream = client.chat.completions.create(
        model=GROQ_CHAT_MODEL,
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.25,
        max_tokens=650,
        stream=True
    )
    
    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            # Clean think tags if streaming
            yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"
