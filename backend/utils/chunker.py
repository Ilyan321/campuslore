import re
from typing import List

def semantic_chunk(text: str, max_chars: int = 500, overlap: int = 100) -> List[str]:
    """
    Splits text into semantically safe overlapping chunks.
    Prioritizes splitting along paragraph breaks, markdown sections, 
    code blocks, or sentence endings to prevent losing context or hallucinating.
    """
    if not text:
        return []
    
    cleaned_text = text.strip()
    if len(cleaned_text) <= max_chars:
        return [cleaned_text]
    
    # Split paragraphs first
    paragraphs = re.split(r'(\n{2,}|\r\n{2,})', cleaned_text)
    
    units = []
    for p in paragraphs:
        if not p.strip():
            continue
        # If paragraph itself is longer than max_chars, split into sentence units
        if len(p) > max_chars:
            sentences = re.split(r'(?<=[.?!;])\s+|\n', p)
            for s in sentences:
                if s.strip():
                    units.append(s.strip())
        else:
            units.append(p.strip())
            
    chunks = []
    current_chunk = ""
    
    for unit in units:
        if not current_chunk:
            current_chunk = unit
        elif len(current_chunk) + len(unit) + 1 <= max_chars:
            current_chunk += "\n" + unit
        else:
            chunks.append(current_chunk.strip())
            # Maintain context overlap
            if len(current_chunk) > overlap:
                overlap_text = current_chunk[-overlap:]
                # Try not to cut in middle of a word in overlap
                space_idx = overlap_text.find(" ")
                if space_idx != -1:
                    overlap_text = overlap_text[space_idx + 1:]
                current_chunk = overlap_text + "\n" + unit
            else:
                current_chunk = unit
                
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
        
    return chunks
