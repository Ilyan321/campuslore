import io
import time
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

def extract_text_from_pdf_local(file_bytes: bytes, max_pages: int = 150) -> str:
    """Extracts raw digital text from PDF locally using pdfplumber with 0 API calls."""
    text_content = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        total_pages = len(pdf.pages)
        pages_to_read = min(total_pages, max_pages)
        for page_idx in range(pages_to_read):
            page_text = pdf.pages[page_idx].extract_text()
            if page_text and page_text.strip():
                text_content.append(f"--- Page {page_idx + 1} ---\n{page_text.strip()}")
    return "\n\n".join(text_content)

def ocr_scanned_pdf_pages(file_bytes: bytes, max_scanned_pages: int = 15) -> str:
    """
    For PDFs that are 100% scanned images (photocopies/handwriting photos converted to PDF),
    converts up to max_scanned_pages to image bytes and transcribes them via Gemini Flash OCR
    with safe delay between calls to respect rate limits.
    """
    client = get_gemini_client()
    if not client:
        return ""
        
    from google.genai import types
    ocr_results = []
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total = len(pdf.pages)
            limit = min(total, max_scanned_pages)
            logger.info(f"PDF is a scanned image document. Processing {limit} of {total} scanned pages with Gemini OCR...")
            
            for page_num in range(limit):
                page = pdf.pages[page_num]
                # Render page to PIL image
                img = page.to_image(resolution=150).original
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=85)
                page_bytes = img_byte_arr.getvalue()
                
                part = types.Part.from_bytes(data=page_bytes, mime_type='image/jpeg')
                prompt = (
                    "Transcribe all handwritten and printed academic content, math formulas, and code "
                    f"from Page {page_num + 1} with high precision in Markdown."
                )
                
                resp = client.models.generate_content(
                    model=GEMINI_OCR_MODEL,
                    contents=[part, prompt]
                )
                if resp and resp.text:
                    ocr_results.append(f"--- Page {page_num + 1} (Scanned OCR) ---\n{resp.text.strip()}")
                    
                # 1.0s pause between pages to stay safely below rate limits
                time.sleep(1.0)
                
        return "\n\n".join(ocr_results)
    except Exception as e:
        logger.error(f"Scanned PDF OCR processing failed: {e}")
        return ""

def extract_text_from_document(file_bytes: bytes, filename: str, mime_type: str) -> str:
    """
    Smart Local-First Document Parser:
    1. Code/Text files -> Instant local extraction (0 API calls).
    2. Digital PDFs -> Checks for digital text locally first via pdfplumber (0 API calls, handles 100+ pages in <0.5s).
    3. Scanned PDFs (Photos in PDF) -> Page-by-page bounded OCR with rate-limit protection.
    4. Photos/Scanned Handwriting (.png, .jpg) -> Gemini Flash Multimodal OCR.
    """
    filename_lower = filename.lower()
    
    # 1. Text & Code files: Instant local extraction (0 API calls)
    if filename_lower.endswith(('.py', '.cpp', '.c', '.java', '.js', '.ts', '.txt', '.md', '.sql', '.html', '.css')):
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return file_bytes.decode('latin-1', errors='ignore')

    # 2. PDFs: Local-First Digital Extraction (Handles 100+ page digital PDFs with zero API rate limits)
    if filename_lower.endswith('.pdf') or 'pdf' in mime_type:
        try:
            local_text = extract_text_from_pdf_local(file_bytes)
            # If the PDF contains readable digital text, return immediately!
            if local_text and len(local_text.strip()) > 50:
                logger.info(f"Successfully extracted {len(local_text)} characters from {filename} locally via pdfplumber (0 API calls).")
                return local_text
            else:
                # PDF is a scanned photocopy / scanned book without digital text -> Use bounded OCR
                logger.info(f"PDF {filename} appears to be scanned images. Routing to OCR engine...")
                scanned_text = ocr_scanned_pdf_pages(file_bytes, max_scanned_pages=15)
                if scanned_text.strip():
                    return scanned_text
        except Exception as e:
            logger.warning(f"PDF extraction error: {e}")

    # 3. Single Image Photos / Handwriting (.png, .jpg, .jpeg)
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
            
            part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
            response = client.models.generate_content(
                model=GEMINI_OCR_MODEL,
                contents=[part, prompt]
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini OCR processing failed: {e}. Falling back to standard parser.")

    return f"[Document: {filename} uploaded successfully]"
