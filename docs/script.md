# CampusVault — Presentation Content

---

## Project Name
**CampusVault**
Tagline: *Grounded Knowledge Engine — Agentic RAG for University Exam Prep*
Live URL: **batchmate.ilyankhan.tech**

---

## Team Members
- Shahzaib Ali
- Ali Hussain
- Aqsa Sarfaraz
- Arfa Rehman
- Zainab Faiz
- Warda Nadeem

---

## Problem Statement

Every semester, engineering students fail exams not because they don't study — but because the AI tools they use hallucinate wrong answers.

- ChatGPT and other generic AI models make up formulas, give wrong algorithm traces, and have zero knowledge of your university syllabus or professor's grading rubric
- They give no citations — students cannot verify if the answer is correct
- Basic RAG (Retrieval Augmented Generation) doesn't fix this either — it just does a dumb keyword search and pastes whatever it finds
- Students are buried under 400+ pages of unstructured PDFs, WhatsApp drives, and scattered handwritten notes
- Senior notes and solved papers disappear every year when students graduate
- There is no 24/7 academic help grounded in actual course material

---

## Solution

**CampusVault** is an Agentic RAG system built specifically for engineering university students. It answers exam questions with verified citations from real peer notes — no hallucinations.

### What makes it Agentic RAG (not basic RAG):

1. **Agentic Query Router** — When a student asks a question, the system doesn't just do a vector search. It first identifies the subject (OS, Networks, DSA, DBMS, Digital Logic, Math), figures out the curriculum week, and decides the best retrieval strategy — like an intelligent planner.

2. **Confidence Gate** — After retrieval, the system checks the similarity score. If it's below 0.65, the system explicitly tells the student "I am operating in General AI Mode — I could not find verified peer notes for this." It never pretends to be grounded when it isn't.

3. **AST-Aware Chunking** — When uploading notes, the system doesn't blindly split text every 500 characters. It uses AST (Abstract Syntax Tree) parsing to respect code function boundaries in C++/Python and equation blocks in LaTeX so derivations are never cut in half.

4. **Peer-Grounded Citations** — Every answer shows exactly which senior note or lecture slide it came from, with a similarity score. Students can verify the source.

5. **16-Week Curriculum Mapping** — The system is organized around a 16-week semester timeline across 6 engineering subjects so students can target specific exam topics.

6. **Real-Time Streaming** — Answers stream token by token in under 500ms using Server-Sent Events so it feels instant.

7. **KaTeX Math Rendering** — Mathematical formulas are rendered beautifully in LaTeX so binary calculations, linear algebra, and networking math display properly.

---

## Features

- Ask any question from 6 engineering subjects and get a grounded answer from verified peer notes
- Auto-detects which subject and week your question belongs to
- Shows the exact source chunk used to answer — with similarity percentage
- Upload your own notes (PDF, Python, C++, Markdown) and they get AST-chunked and embedded into the knowledge base
- Mobile and desktop responsive — works on any device
- Multi-turn session history — keeps track of your conversation
- High-yield topic launchpad — pre-loaded exam questions you can click to run instantly
- If no relevant notes are found, system honestly says so instead of hallucinating

---

## Technology Stack

| What | Technology |
|------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI (Python) |
| LLM | Groq Llama 3.3 70B |
| Embeddings | FastEmbed (ONNX runtime, 384-dim vectors) |
| Vector Database | PostgreSQL with pgvector extension |
| Math Rendering | KaTeX |
| File Storage | Supabase |
| Hosting | Vercel (frontend), Render (backend) |
| Streaming | Server-Sent Events (SSE) |

---

## Architecture — How System Components Talk to Each Other

Flow from student question to answer:

1. **Student types a question** in the React frontend (hosted on Vercel)
2. Frontend sends the question to the **FastAPI backend** over HTTPS
3. Backend passes it to the **Agentic Query Router** which identifies subject + week + retrieval strategy
4. **FastEmbed** (running locally on ONNX — no external API) converts the question into a 384-dimensional vector
5. This vector searches the **PostgreSQL pgvector** database using hybrid search (cosine similarity + keyword) — takes under 20ms
6. **Confidence Gate** checks the similarity score — above 0.65 means grounded mode, below means general mode
7. Retrieved context is sent to **Groq's Llama 3.3 70B** model along with a strict grounding prompt
8. Groq streams the answer token by token back through **Server-Sent Events (SSE)** to the frontend
9. Frontend renders the answer with **KaTeX** for math formulas and shows source citations

**Key point:** FastEmbed runs on local ONNX runtime — no GPU needed, no external embedding API, no cost per request.

---

## What to Say About the Demo Video

The live demo is a separate video. In the presentation just mention:
> "A full live demo showing the Agentic RAG pipeline in action, source inspection, and mobile view is included in our demo video."

---

## Speaker Notes (for whoever is presenting)

- The most important technical point to emphasize: **Confidence Gate** — this is what separates Agentic RAG from basic RAG. Judges from the HEC PAK ANGELS course will specifically be looking for this.
- Say the words **"Agentic RAG"** clearly — not just "RAG". The course is specifically about Agentic RAG.
- Total presentation time should be 4 to 5 minutes. Do not go over 5 minutes.
