import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", ""))
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Cache directories for HuggingFace embeddings
default_hf_cache = os.environ.get("RENDER") and "/opt/render/project/.cache/huggingface" or os.path.expanduser("~/.cache/huggingface")
HF_HOME: str = os.getenv("HF_HOME", default_hf_cache)
os.environ["HF_HOME"] = HF_HOME

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
GROQ_CLASSIFIER_MODEL = "qwen/qwen3.6-27b"
GROQ_CHAT_MODEL = "qwen/qwen3.6-27b"
GEMINI_OCR_MODEL = "gemini-2.5-flash"
