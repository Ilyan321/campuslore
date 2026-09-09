import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", ""))
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Cache directories for HuggingFace embeddings
HF_HOME: str = os.getenv("HF_HOME", "/opt/render/project/.cache/huggingface")
os.environ["HF_HOME"] = HF_HOME

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
GROQ_CLASSIFIER_MODEL = "llama-3.1-8b-instant"
GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"
GEMINI_OCR_MODEL = "gemini-2.5-flash"
