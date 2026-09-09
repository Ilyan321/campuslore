import logging
from typing import List, Union
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL_NAME

logger = logging.getLogger("campuslore.embedder")

_model: Union[SentenceTransformer, None] = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
        # BAAI/bge-small-en-v1.5 produces 384-dimensional vectors
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model

def get_embedding(text: str) -> List[float]:
    """
    Generates a normalized 384-dim vector embedding for a single text string.
    """
    model = get_model()
    # Normalize embeddings to ensure standard cosine distance calculations
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates normalized 384-dim vector embeddings for a list of text strings in batch.
    """
    if not texts:
        return []
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=16)
    return embeddings.tolist()
