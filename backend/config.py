import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", ""))
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Cache directories for HuggingFace embeddings
# If HF_HOME is set in env (e.g. on Render), use that; otherwise use user's local cache directory
default_hf_cache = os.environ.get("RENDER") and "/opt/render/project/.cache/huggingface" or os.path.expanduser("~/.cache/huggingface")
HF_HOME: str = os.getenv("HF_HOME", default_hf_cache)
os.environ["HF_HOME"] = HF_HOME

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
GROQ_CLASSIFIER_MODEL = "llama-3.1-8b-instant"
GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"
GEMINI_OCR_MODEL = "gemini-2.5-flash"
