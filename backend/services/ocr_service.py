import io
import logging
from typing import Optional
import pdfplumber
from config import GEMINI_API_KEY, GEMINI_OCR_MODEL

logger = logging.getLogger("campuslore.ocr")

_genai_client = None

def get_gemini_client():
    global _genai_client
    if _genai_client is None and GEMINI_API_KEY:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize google-genai client: {e}")
    return _genai_client

def extract_text_from_pdf_fallback(file_bytes: bytes) -> str:
    """Extracts raw text from PDF using pdfplumber."""
    text_content = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(f"--- Page {page_idx + 1} ---\n{page_text}")
    return "\n\n".join(text_content)

def extract_text_from_document(file_bytes: bytes, filename: str, mime_type: str) -> str:
    """
    Extracts high-fidelity academic text, handwritten formulas, diagrams, and code 
    from images, scanned PDFs, or text documents using Gemini Flash multimodal OCR.
    Falls back gracefully to local parsers if API key is not present.
    """
    filename_lower = filename.lower()
    
    # Text and Code files: Direct extraction
    if filename_lower.endswith(('.py', '.cpp', '.c', '.java', '.js', '.ts', '.txt', '.md', '.sql', '.html', '.css')):
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return file_bytes.decode('latin-1', errors='ignore')

    client = get_gemini_client()
    if client:
        try:
            from google.genai import types
            
            prompt = (
                "You are an expert academic OCR and document digitization system for university engineering notes. "
                "Transcribe all content from this document/image with 100% precision. "
                "Include handwritten notes, whiteboard diagrams described in clear text, mathematical equations, "
                "data structures, pseudo-code, code listings, and bullet points. "
                "Output clean, structured Markdown preserving indentation and logic."
            )
            
            # Format contents with types.Part.from_bytes
            part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
            response = client.models.generate_content(
                model=GEMINI_OCR_MODEL,
                contents=[part, prompt]
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini OCR processing failed: {e}. Falling back to standard parser.")

    # Fallback for PDFs
    if filename_lower.endswith('.pdf') or 'pdf' in mime_type:
        try:
            fallback_text = extract_text_from_pdf_fallback(file_bytes)
            if fallback_text.strip():
                return fallback_text
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")

    return f"[Document: {filename} uploaded. (Multimodal OCR requires GEMINI_API_KEY for rich handwritten transcript)]"
