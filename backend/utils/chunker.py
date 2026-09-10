import re
from typing import List

def _split_code_blocks(text: str) -> List[str]:
    """
    Splits source code into logical AST-like blocks (classes, functions, struct definitions)
    to prevent slicing functions, loops, or docstrings in half.
    """
    lines = text.splitlines(keepends=True)
    blocks: List[str] = []
    current_block: List[str] = []
    
    # Regex matching function or class definitions across Python, C/C++, Java, JS/TS
    def_pattern = re.compile(r'^(?:def |class |async def |void |int |double |float |bool |struct |enum |template|function |export )', re.MULTILINE)
    
    for line in lines:
        # If line starts at column 0 with a function/class header and we have accumulated lines
        if def_pattern.match(line) and current_block:
            blocks.append("".join(current_block).strip())
            current_block = [line]
        else:
            current_block.append(line)
            
    if current_block:
        blocks.append("".join(current_block).strip())
        
    return [b for b in blocks if b]

def _split_markdown_sections(text: str) -> List[str]:
    """
    Splits markdown text on section headers (# , ## , ### ) and fenced code blocks.
    """
    # Split on markdown headers
    header_pattern = re.compile(r'(?=\n#{1,4}\s+)')
    sections = header_pattern.split(text)
    return [s.strip() for s in sections if s.strip()]

def recursive_chunk(
    text: str,
    max_chars: int = 600,
    overlap: int = 120,
    is_code: bool = False
) -> List[str]:
    """
    AST & Boundary-Aware Recursive Chunker:
    1. Respects code boundaries (classes, functions, loops) and Markdown section headers.
    2. Recursively subdivides large sections on paragraphs, sentences, and statement boundaries.
    3. Maintains semantic overlap without cutting mid-word or mid-syntax.
    """
    if not text or not text.strip():
        return []
        
    cleaned = text.strip()
    if len(cleaned) <= max_chars:
        return [cleaned]
        
    # Phase 1: High-level structural units
    if is_code or "```" in cleaned or re.search(r'^(?:def |class |void |int |struct )\w+', cleaned, re.MULTILINE):
        raw_units = _split_code_blocks(cleaned)
    elif re.search(r'\n#{1,4}\s+', cleaned):
        raw_units = _split_markdown_sections(cleaned)
    else:
        raw_units = re.split(r'\n{2,}|\r\n{2,}', cleaned)
        
    # Phase 2: Recursively decompose oversized units
    refined_units: List[str] = []
    for unit in raw_units:
        if len(unit) <= max_chars:
            refined_units.append(unit.strip())
        else:
            # Sub-split on paragraphs first
            paras = re.split(r'\n{2,}|\r\n{2,}', unit)
            for p in paras:
                if len(p) <= max_chars:
                    if p.strip():
                        refined_units.append(p.strip())
                else:
                    # Sub-split on lines or sentences
                    lines_or_sentences = re.split(r'(?<=[.?!;])\s+|\n', p)
                    for s in lines_or_sentences:
                        if len(s) <= max_chars:
                            if s.strip():
                                refined_units.append(s.strip())
                        else:
                            # Sub-split on whitespace word boundaries
                            words = s.split(' ')
                            buf = ""
                            for w in words:
                                if len(buf) + len(w) + 1 <= max_chars:
                                    buf = f"{buf} {w}".strip()
                                else:
                                    if buf:
                                        refined_units.append(buf)
                                    buf = w
                            if buf:
                                refined_units.append(buf)
                                
    # Phase 3: Pack into target chunk size with semantic overlap
    chunks: List[str] = []
    current_chunk = ""
    
    for unit in refined_units:
        if not current_chunk:
            current_chunk = unit
        elif len(current_chunk) + len(unit) + 1 <= max_chars:
            current_chunk += "\n\n" + unit
        else:
            chunks.append(current_chunk.strip())
            # Build overlap window
            if len(current_chunk) > overlap:
                overlap_text = current_chunk[-overlap:]
                # Align to nearest whitespace or newline
                space_idx = overlap_text.find("\n")
                if space_idx == -1:
                    space_idx = overlap_text.find(" ")
                if space_idx != -1:
                    overlap_text = overlap_text[space_idx + 1:]
                current_chunk = overlap_text + "\n\n" + unit
            else:
                current_chunk = unit
                
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
        
    return chunks

# Backwards-compatible alias
def semantic_chunk(text: str, max_chars: int = 600, overlap: int = 120, is_code: bool = False) -> List[str]:
    return recursive_chunk(text, max_chars=max_chars, overlap=overlap, is_code=is_code)

