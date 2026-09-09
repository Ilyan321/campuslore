import logging
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import SUPABASE_URL, GROQ_API_KEY
from services.ocr_service import extract_text_from_document
from services.classifier_service import classify_syllabus_week, load_syllabus
from services.embedder_service import get_embeddings_batch
from services.supabase_service import upload_file_to_storage, insert_note_chunks, get_supabase_client
from services.rag_service import execute_rag_pipeline, stream_rag_pipeline
from services.agentic_rag_service import run_agentic_rag
from utils.chunker import semantic_chunk

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("campuslore.api")

app = FastAPI(
    title="CampusLore RAG API",
    description="Hyper-reliable, low-memory RAG backend for university engineering notes",
    version="1.0.0"
)

# Enable CORS for React frontend on Vercel / localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConfirmIngestRequest(BaseModel):
    file_name: str
    file_url: Optional[str] = None
    course_id: str
    week_number: int
    topic: str
    content: str

class QueryRequest(BaseModel):
    query: str
    week_number: int
    course_id: Optional[str] = "CSE-212"
    match_threshold: Optional[float] = 0.25
    match_count: Optional[int] = 4

@app.get("/")
def root():
    return {
        "app": "CampusLore API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database_connected": bool(SUPABASE_URL),
        "groq_configured": bool(GROQ_API_KEY)
    }

@app.get("/api/syllabus")
def get_syllabus():
    """Returns the university syllabus timelines for all courses."""
    return load_syllabus()

@app.post("/api/ingest/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    course_id: Optional[str] = Form("CSE-212")
):
    """
    Step 1 of Workflow A: Receives file, extracts text/diagrams via Gemini Flash OCR,
    and runs AI syllabus classification. Returns parsed preview for senior's confirmation.
    """
    try:
        content_bytes = await file.read()
        file_name = file.filename or "uploaded_file"
        mime_type = file.content_type or "application/octet-stream"

        # 1. High-Density Multimodal OCR
        extracted_text = extract_text_from_document(content_bytes, file_name, mime_type)
        
        # 2. Upload file to Supabase storage bucket
        file_url = upload_file_to_storage("campuslore-notes", f"uploads/{file_name}", content_bytes, mime_type)

        # 3. AI Syllabus Classifier
        classification = classify_syllabus_week(extracted_text, course_id)

        return {
            "file_name": file_name,
            "file_url": file_url,
            "extracted_text": extracted_text,
            "preview": extracted_text[:400] + ("..." if len(extracted_text) > 400 else ""),
            "classification": classification
        }
    except Exception as e:
        logger.error(f"Error during document analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/ingest/confirm")
def confirm_ingestion(payload: ConfirmIngestRequest):
    """
    Step 2 of Workflow A: Senior confirms or overrides the AI-assigned week.
    Chunks text, computes 384-dim embeddings via BGE-small, and stores into Supabase pgvector.
    """
    try:
        # 1. Semantic Chunking
        chunks = semantic_chunk(payload.content, max_chars=500, overlap=100)
        if not chunks:
            raise HTTPException(status_code=400, detail="Document content was empty.")

        # 2. Batch Embedding Generation
        embeddings = get_embeddings_batch(chunks)

        # 3. Prepare database records
        records = []
        for idx, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
            records.append({
                "content": chunk_text,
                "embedding": emb,
                "file_url": payload.file_url,
                "file_name": payload.file_name,
                "course_id": payload.course_id,
                "week_number": payload.week_number,
                "topic": payload.topic,
                "chunk_index": idx,
                "metadata": {
                    "total_chunks": len(chunks),
                    "chunk_size": len(chunk_text)
                }
            })

        # 4. Insert into Supabase
        inserted = insert_note_chunks(records)
        return {
            "success": True,
            "message": f"Successfully indexed {len(records)} note chunks for Week {payload.week_number} ({payload.topic})",
            "inserted_count": len(inserted) if inserted else len(records)
        }
    except Exception as e:
        logger.error(f"Error during note confirmation: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/api/query")
def query_rag(payload: QueryRequest):
    """
    Bilingual Agentic RAG: Decomposes query, executes multi-hop vector retrieval,
    grades relevance, and synthesizes bilingual (English / Roman Urdu) grounded answer.
    """
    try:
        result = run_agentic_rag(
            query=payload.query,
            week_number=payload.week_number,
            course_id=payload.course_id or "CSE-212"
        )
        return result
    except Exception as e:
        logger.error(f"Error executing Agentic RAG query: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.post("/api/query/stream")
async def query_rag_stream(payload: QueryRequest):
    """
    Streaming query endpoint for real-time token rendering.
    """
    return StreamingResponse(
        stream_rag_pipeline(payload.query, payload.week_number, payload.course_id),
        media_type="text/event-stream"
    )

@app.get("/api/notes")
def get_notes_for_week(
    course_id: str = Query("CSE-212"),
    week_number: int = Query(...)
):
    """Lists distinct uploaded note files for the selected week."""
    client = get_supabase_client()
    if not client:
        return []
    try:
        response = client.table("notes").select("file_name, file_url, topic, created_at").eq("course_id", course_id).eq("week_number", week_number).execute()
        # Deduplicate by file_name
        seen = set()
        deduped = []
        for row in response.data or []:
            fn = row.get("file_name")
            if fn and fn not in seen:
                seen.add(fn)
                deduped.append(row)
        return deduped
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        return []
