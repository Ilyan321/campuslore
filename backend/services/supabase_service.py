import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger("campuslore.supabase")

_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            logger.warning("SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Using mock or empty client.")
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client

def upload_file_to_storage(bucket_name: str, file_path: str, file_bytes: bytes, content_type: str) -> str:
    """
    Uploads a file to Supabase storage bucket and returns the public URL.
    """
    client = get_supabase_client()
    try:
        # Check / create bucket or upload directly
        client.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        public_url_resp = client.storage.from_(bucket_name).get_public_url(file_path)
        return public_url_resp
    except Exception as e:
        logger.error(f"Error uploading file to Supabase storage: {e}")
        # Return a generated relative reference if storage upload fails or in dev
        return f"/storage/{bucket_name}/{file_path}"

def insert_note_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Inserts note chunks into the 'notes' table.
    """
    client = get_supabase_client()
    try:
        response = client.table("notes").insert(chunks).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error inserting note chunks: {e}")
        raise e

def search_similar_notes(
    query_embedding: List[float],
    filter_week: Optional[int] = None,
    filter_course: Optional[str] = None,
    match_threshold: float = 0.35,
    match_count: int = 5
) -> List[Dict[str, Any]]:
    """
    Calls the Supabase 'match_notes' RPC function with pgvector HNSW search.
    """
    client = get_supabase_client()
    try:
        params = {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count,
            "filter_week": filter_week,
            "filter_course": filter_course
        }
        response = client.rpc("match_notes", params).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error performing match_notes RPC: {e}")
        return []
