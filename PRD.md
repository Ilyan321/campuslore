# 📚 CampusLore
### *Your Campus. Your Notes. Your AI.*

---

> **Product Requirements Document — MVP Edition**
>
> | Field | Detail |
> |---|---|
> | **Author** | Ilyan Khan (`lucian__codes`) |
> | **Version** | 1.0.0 — Hackathon Prototype |
> | **Target Event** | Pak Angels × HEC GenAI Hackathon |
> | **Target Users** | Engineering & CS Students (QUEST Nawabshah / MUET Jamshoro) |
> | **Budget Scope** | $0 — Free Tier Only |
> | **Document Status** | ✅ Active |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [MVP Scope & Feature Set](#4-mvp-scope--feature-set)
5. [User Workflows](#5-user-workflows)
6. [Technical Architecture](#6-technical-architecture)
7. [Data & Syllabus Strategy](#7-data--syllabus-strategy)
8. [API Rate Limit & Risk Mitigation](#8-api-rate-limit--risk-mitigation)
9. [MVP Success Metrics](#9-mvp-success-metrics)
10. [Out of Scope (Post-MVP)](#10-out-of-scope-post-mvp)

---

## 1. Executive Summary

University students at institutions like QUEST Nawabshah and MUET Jamshoro face a daily, unspoken reality: **the knowledge that actually helps you pass your exams does not live in textbooks**. It lives in a senior's handwritten notebook, in a WhatsApp voice note, in a shared Google Drive link that expires in 48 hours, or in the notes scribbled on a whiteboard that got erased after the lab session ended.

**CampusLore** is a hyper-local, open-source, multimodal knowledge platform built to fix this. It is a structured bridge between the *unofficial shadow knowledge economy* that students already rely on and a clean, AI-powered interface that makes that knowledge instantly searchable, contextual, and grounded to the official university syllabus.

At its core, CampusLore allows senior students to **upload** their notes, lab scripts, PDFs, and scanned images into a shared campus knowledge base. A Retrieval-Augmented Generation (RAG) pipeline then **automatically indexes and maps** these assets to the correct week in the university syllabus — without any manual tagging by the uploader. Junior students can then **query** this knowledge base in natural language — including Roman Urdu/English mixed dialect — and receive answers that are directly sourced from their own peers' materials, not from generic internet data.

The result is a **zero-hallucination, zero-cost, community-first** academic assistant that speaks the student's language, literally and figuratively.

---

## 2. Problem Statement

### 2.1 Severe Knowledge Fragmentation

Valuable academic resources — past paper solutions, handwritten lab cheat sheets, working code for assignments — are scattered across highly volatile, ephemeral channels. WhatsApp media logs disappear. Discord servers go inactive. Google Drive links get revoked. Private hard drives stay private.

Juniors waste **more time hunting for materials than actually studying them**. There is no central, persistent, structured home for campus-specific peer knowledge.

### 2.2 The Context & Language Gap

Standard LLMs like ChatGPT are generalist tools. When an engineering student asks about a specific lab exercise at 2 AM, they get generic documentation-level answers that don't account for:

- What their **specific department** tests for.
- Which **library version** their university's lab machines actually have installed.
- The **natural way** a Pakistani engineering student phrases a technical question (Roman Urdu + English code-switch).

The student is left with "AI slop" that doesn't map to their reality.

### 2.3 The Unstructured Media Barrier

A massive portion of the best student knowledge is **non-textual**. Whiteboard photos, handwritten notebook scans, flat PDF lab manuals with diagrams — these are invisible to standard text-based search engines. The most helpful materials are structurally the hardest to query.

### 2.4 The Syllabus Alignment Problem

Even when students find resources, they are often not sure if those resources are **relevant to what their professor is currently teaching**. Without a week-by-week grounding mechanism, resources exist in a vacuum, creating confusion about what to focus on before an exam.

---

## 3. Target Users & Personas

### Persona A — The Senior Contributor: "Zain"

| Attribute | Detail |
|---|---|
| **Year** | Final year, Computer Systems Engineering |
| **Situation** | Has years of handwritten notes, working lab code, and past paper PDFs |
| **Pain Point** | Juniors constantly ping him on WhatsApp asking for the same files over and over |
| **Goal** | Upload everything once, stop being a personal Google Drive for 30 people |
| **Motivation** | Give back to the department; maybe get some recognition for being helpful |

### Persona B — The Junior Learner: "Ayesha"

| Attribute | Detail |
|---|---|
| **Year** | Second year, Electrical Engineering |
| **Situation** | Has a lab exam in 2 days, textbook is too dense, professor was unclear |
| **Pain Point** | Her seniors' notes are scattered, she doesn't know who to ask, doesn't want to sound dumb |
| **Goal** | Get a clear, understandable explanation of the lab topic with a working example |
| **Motivation** | Pass the exam and actually understand what she's doing |

---

## 4. MVP Scope & Feature Set

The MVP is intentionally narrow. The goal is to prove **one end-to-end workflow perfectly** rather than ten workflows partially.

### ✅ In Scope for MVP

| Feature | Priority | Notes |
|---|---|---|
| Senior file upload interface (drag & drop) | P0 — Critical | Accepts `.pdf`, `.png`, `.jpg`, `.jpeg`, `.py`, `.cpp` |
| Automatic syllabus week mapping via AI | P0 — Critical | No manual tagging required from uploader |
| Upload confirmation card with manual override | P1 — High | Shows AI-assigned week; allows correction before saving |
| Week-based timeline sidebar navigation | P0 — Critical | Filters entire workspace context to selected week |
| Contextual AI chat interface | P0 — Critical | Sandboxed to peer notes for selected week only |
| Roman Urdu/English mixed language support | P1 — High | Natural query phrasing in local dialect |
| Source slide-out panel | P1 — High | Shows original note/image used to generate the AI answer |
| 2 seeded prototype courses | P0 — Critical | Data Structures & Algorithms + Computer Networks |

### ❌ Out of Scope for MVP

- User authentication / account system
- Mobile application
- Real-time collaborative editing
- Admin panel for department heads
- Support for video/audio files
- Multi-university support

---

## 5. User Workflows

### Workflow A — Senior Contributor: Uploading Notes

This workflow covers the full journey from a senior dropping a file to it being live and queryable in the knowledge base.

```
Step 1: Senior opens the CampusLore Ingest Dashboard
        └── Sees a clean drag-and-drop dropzone UI

Step 2: Senior drags a folder of mixed files (.py, .pdf, .png)
        └── UI shows upload progress indicators per file

Step 3: Backend Multimodal Processing
        ├── PDFs & Images → Gemini Flash (Free AI Studio Tier)
        │   └── High-density OCR extracts raw text, handwriting, equations
        └── Code files → Direct text extraction

Step 4: AI Syllabus Classification
        └── Extracted text → Groq (Llama-3.1-8b-instant)
            └── Returns structured JSON: { "assigned_week": 12, "topic": "Graph Traversals" }

Step 5: Confirmation Card appears on screen
        ├── Displays: "AI processed your note → Assigned to Week 12: Graph Traversals"
        └── Dropdown override available if AI got it wrong

Step 6: On confirmation, file is chunked, embedded, and saved to Supabase pgvector DB
        └── Success toast: "Your note is now live for your juniors 🎉"
```

**Key Design Principle:** The senior should be able to complete this entire workflow in under 60 seconds. Zero friction, zero labeling work.

---

### Workflow B — Junior Learner: Querying Peer Notes

This workflow covers the full journey from a junior selecting a topic to receiving a sourced, localized answer.

```
Step 1: Junior opens CampusLore
        └── Sees a week-by-week timeline sidebar (e.g., Week 1, Week 2 ... Week 16)

Step 2: Junior clicks on "Week 5: Queue Data Structure"
        └── UI workspace updates — all context is now filtered to Week 5 materials

Step 3: Junior types a question in the chat input
        Example: "Yaar circular queue mein rear pointer reset kab hota hai?"

Step 4: RAG Pipeline Executes
        ├── Query is embedded into a vector via Hugging Face / Gemini Embeddings
        ├── Cosine similarity scan runs against Supabase pgvector
        │   └── Only Week 5 documents are searched (hard filter)
        └── Top 3 matching note chunks are retrieved with their source file URLs

Step 5: Retrieved chunks are injected into a grounded system prompt
        └── Dispatched to Llama-3.3-70b-versatile on Groq for streaming inference

Step 6: Junior sees a dual-layer response
        ├── Left Panel: Conversational answer in Roman Urdu/English with code snippets
        └── Right Panel (on "View Source" click): Slide-out modal showing the actual
            handwritten note or PDF page the AI pulled from
```

**Key Design Principle:** The junior must always be able to see *where* the answer came from. No anonymous AI output. Every answer is traceable to a real peer's material.

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React.js (Vite) + Tailwind CSS | Fast build, component-driven, great DX |
| **UI Theme** | Deep Slate + Charcoal + Soft Amber accents | Low-light, developer-centric, non-fatiguing for late-night use |
| **Backend / BaaS** | Supabase (PostgreSQL + pgvector) | Handles auth, file storage buckets, relational tables, and vector search — all on free tier |
| **OCR / Multimodal** | Gemini 1.5 Flash (Google AI Studio — Free) | Best-in-class free OCR for handwriting, scans, and PDFs |
| **LLM Inference** | Groq API — Free Tier (LPU hardware) | Ultra-low latency token generation; the fastest free inference available |
| **Classification Model** | `llama-3.1-8b-instant` via Groq | Lightweight, fast; handles syllabus JSON mapping |
| **Chat Model** | `llama-3.3-70b-versatile` via Groq | High reasoning capability; handles Roman Urdu/English dialect + code generation |
| **Embedding Engine** | Hugging Face Inference API OR Gemini Embeddings (Free) | Converts text chunks to 768/1536-dim float vectors for pgvector similarity search |
| **Orchestration** | Minimal Python / Node.js pipeline | No heavy agent frameworks; lean and latency-optimized |

---

### 6.2 Multimodal Ingestion Pipeline

```
[ Senior Uploads File(s) ]
         │
         ▼
[ File Type Router ]
         ├── .py / .cpp / .txt ──────────────────────────────────────────────────┐
         │                                                                        │
         └── .pdf / .png / .jpg / .jpeg                                          │
                  │                                                               │
                  ▼                                                               │
    [ Gemini 1.5 Flash — Multimodal OCR ]                                        │
         │  Extracts: raw text, handwritten paths, math equations, diagrams      │
         │                                                                        │
         ▼                                                                        ▼
[ Extracted Raw Text Matrix ] ◄──────────────────────────[ Direct Code Text ]
         │
         ▼
[ Groq — Llama-3.1-8b-instant: Syllabus Classifier ]
         │  Input: Raw extracted text
         │  Output: { "assigned_week": 12, "confidence": 0.91 }
         │
         ▼
[ Chunking Engine ]
         │  Strategy: 500-character chunks, 100-character overlap
         │  Ensures semantic context is preserved across chunk boundaries
         │
         ▼
[ Embedding Engine ]
         │  Hugging Face / Gemini Embeddings API
         │  Converts each chunk → 768 or 1536 dimension float array
         │
         ▼
[ Supabase pgvector Save ]
         │  Stores: { content, embedding, file_url, week_number, course_id }
         └──► Note is now live and queryable
```

---

### 6.3 RAG Query Pipeline

```
[ Junior enters query in Week 5 context ]
         │
         ▼
[ Embed the query string ]
         │  Same embedding model used during ingestion
         │  Output: query_vector (float[768])
         │
         ▼
[ Supabase pgvector Cosine Similarity Search ]
         │
         │  SQL RPC:
         │  SELECT content, file_url, similarity
         │  FROM match_notes(query_embedding, match_threshold => 0.7, match_count => 3)
         │  WHERE week_number = active_selected_week;
         │
         ▼
[ Top 3 Note Chunks Retrieved + their file_urls ]
         │
         ▼
[ System Prompt Construction ]
         │
         │  SYSTEM: You are a brilliant, empathetic engineering senior at QUEST.
         │  Answer the student's question STRICTLY based on the peer-notes below.
         │  If the answer is not in the provided context, say so clearly.
         │  Use natural Roman Urdu + technical English in your response.
         │
         │  CONTEXT:
         │  --- [Chunk 1 from Senior_File_A.pdf] ---
         │  --- [Chunk 2 from Senior_File_B.png] ---
         │  --- [Chunk 3 from Senior_File_C.py] ---
         │
         │  STUDENT QUESTION: [user query string]
         │
         ▼
[ Groq — Llama-3.3-70b-versatile ]
         │  Streams token response back to frontend
         │
         ▼
[ React Frontend Render ]
         ├── Chat panel: Streams conversational answer with code blocks
         └── Source panel: Binds file_url(s) to slide-out preview modal
```

---

## 7. Data & Syllabus Strategy

### 7.1 Prototype Data Scope

The MVP scopes to **2 highly challenging core engineering courses**. Depth over breadth — the goal is to demonstrate a fully functional vertical slice, not a wide shallow demo.

| Course | Course ID | Weeks Seeded |
|---|---|---|
| Data Structures & Algorithms | CSE-212 | 4 weeks (Queues, Stacks, Trees, Graphs) |
| Data & Computer Networks | CSE-305 | 4 weeks (OSI Model, Subnetting, Routing, TCP/UDP) |

### 7.2 Syllabus JSON Schema

The "Ground Truth" engine is powered by a pre-seeded JSON file that acts as the mapping backbone for the classifier.

```json
[
  {
    "course_id": "CSE-212",
    "course_name": "Data Structures & Algorithms",
    "department": "Computer Systems Engineering",
    "syllabus_timeline": [
      {
        "week": 5,
        "core_topic": "Queue Data Structure & Circular Implementations",
        "grounding_keywords": [
          "enqueue", "dequeue", "front", "rear",
          "circular queue", "fifo", "buffer overflow"
        ]
      },
      {
        "week": 12,
        "core_topic": "Graph Traversals and Shortest Path Optimization",
        "grounding_keywords": [
          "dijkstra", "bfs", "dfs", "adjacency matrix",
          "shortest path", "visited array", "cost matrix"
        ]
      }
    ]
  }
]
```

### 7.3 Bootstrapping Strategy

Since we cannot request official data from university administration in time, the syllabus JSON will be manually constructed based on:

1. **Publicly available QUEST / MUET course outlines** (found on official department pages).
2. **Community verification** from at least 2 current students who can confirm topic-week alignment.
3. **Iterative updates** — the JSON schema is designed to be easily extended by any contributor via a simple pull request.

---

## 8. API Rate Limit & Risk Mitigation

The entire platform runs on free API tiers. This is a strength (zero cost) but requires deliberate engineering to avoid crashes during a live demo.

### 8.1 Groq Free Tier Limits

| Metric | Limit | Our Strategy |
|---|---|---|
| Requests Per Minute (RPM) | 30 RPM | Sequential queuing with 1.5s async delay between calls |
| Tokens Per Minute (TPM) | ~14,400 TPM | Chunk size capped at 500 chars; system prompts kept lean |
| Daily Request Limit | Varies | Local caching of frequent query responses |

### 8.2 Mitigation Strategies

**Sequential Ingestion Processing**
When multiple files are uploaded simultaneously, the backend does not fire parallel API calls. It queues all OCR and classification requests and processes them one by one with a mandatory `1500ms` async pause between each Groq API call. This guarantees the platform stays within the 30 RPM threshold under any upload volume.

**Intelligent Chat Response Caching**
If multiple users query structurally identical questions within the same week context, the system stores the generated response summary in a temporary in-memory state. Identical query vectors (above a 0.95 similarity threshold) return the cached response, eliminating redundant API calls entirely.

**High-Intelligence Chat Routing**
All user chat queries are routed exclusively to `llama-3.3-70b-versatile`. Despite being the larger model, it handles Roman Urdu dialect translation, complex programming reasoning, and structured answer formatting in one pass — avoiding multi-step API round trips that a smaller model would require.

**Graceful Degradation**
If the Groq API returns a rate-limit error, the frontend displays a friendly message: *"Our AI is taking a quick breath — try again in 5 seconds!"* rather than a raw error state. No crashed demo.

---

## 9. MVP Success Metrics

These are the benchmarks that define whether the hackathon demo is a success.

| Metric | Target |
|---|---|
| File ingestion → queryable | Under 30 seconds per file |
| Syllabus auto-classification accuracy | ≥ 80% on test batch of 10 mixed files |
| Query response latency (end-to-end) | Under 4 seconds on Groq LPU |
| Roman Urdu query handling | Successfully processes 5/5 mixed-dialect test queries |
| Source attribution | 100% of answers link to a traceable source file |
| Zero crashes during live demo | 0 unhandled errors during a 10-minute judging session |
| Wow factor | At least one judge says "yaar yeh toh actually useful hai" |

---

## 10. Out of Scope (Post-MVP)

These features are explicitly deferred to avoid scope creep during the hackathon. They represent a genuine product roadmap if CampusLore gains traction.

| Feature | Why Deferred |
|---|---|
| User accounts & profiles | Adds auth complexity; not needed for demo |
| Senior reputation / karma system | Nice-to-have social layer; post-launch |
| Mobile app (React Native) | Parallel workstream; web-first for now |
| Voice query input | Requires audio streaming pipeline |
| Multi-university support | Need to validate single-campus model first |
| Admin dashboard for faculty | Different user type; separate product track |
| Video/audio file ingestion | Complex transcription pipeline; out of budget |
| Real-time collaborative notes | WebSocket complexity; future v2 feature |

---

*CampusLore — Built by students, for students. No textbook required.*

---

> **Document Version:** 1.0.0 | **Last Updated:** September 2026 | **Author:** Ilyan Khan
