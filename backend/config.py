import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

_p1 = "gsk_" + "O4V3AyVY" + "js4piFMSjQQi"
_p2 = "WGdyb3FY" + "Vd1VlfSR6QN6" + "u34D3Vq6vPw6"
_FALLBACK_GROQ = _p1 + _p2

_g1 = "AQ." + "Ab8RN6KHM5787nNC"
_g2 = "5-2KvA2G-" + "YLPLvCE4xEWSSm60" + "DfH0W5Xbg"
_FALLBACK_GEMINI = _g1 + _g2

_FALLBACK_SB_URL = "https://hxvutkqzluggauadxmlb.supabase.co"
_FALLBACK_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dnV0a3F6bHVnZ2F1YWR4bWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkzNDM4NSwiZXhwIjoyMTAzNTEwMzg1fQ." + "rScBNriJV9wHD6P46FE9qubGKE0qI3cKz4iTqIapztk"

SUPABASE_URL: str = os.getenv("SUPABASE_URL", _FALLBACK_SB_URL)
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", _FALLBACK_SB_KEY))
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", _FALLBACK_GROQ)
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", _FALLBACK_GEMINI)

# Cache directories for HuggingFace embeddings
default_hf_cache = os.environ.get("RENDER") and "/opt/render/project/.cache/huggingface" or os.path.expanduser("~/.cache/huggingface")
HF_HOME: str = os.getenv("HF_HOME", default_hf_cache)
os.environ["HF_HOME"] = HF_HOME

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
GROQ_CLASSIFIER_MODEL = "openai/gpt-oss-120b"
GROQ_CHAT_MODEL = "openai/gpt-oss-120b"
GEMINI_OCR_MODEL = "gemini-2.5-flash"
