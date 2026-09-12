# 🎓 CampusLore — HEC PAK ANGELS Midterm Hackathon Presentation Script
> **Judge Rules**: 4–5 minutes max · Urdu or English · Separate demo video

---

## ⏱️ Time Budget (5 slides × ~50 seconds each = ~4.5 min)

```
Slide 1 — Title + Team         ~30 sec
Slide 2 — Problem Statement    ~60 sec
Slide 3 — Solution + Tech      ~70 sec
Slide 4 — Architecture Diagram ~60 sec
Slide 5 — Closing + Demo Note  ~30 sec
─────────────────────────────────────
TOTAL                          ~4.5 min ✅
```

---

## 👥 Team Members
- Shahzaib Ali
- Ali Hussain
- Aqsa Sarfaraz
- Arfa Rehman
- Zainab Faiz
- Warda Nadeem

---

## 📊 Slide-by-Slide

---

### SLIDE 1 — Project Name & Team (30 sec)

**📸 Screenshot**: `01_desktop_launchpad.png` — one clean shot of the app in the background or as a small preview card

**Title**: **CampusLore**
**Tagline**: *Grounded Knowledge Engine — Agentic RAG for University Exam Prep*
**Course Badge**: `HEC PAK ANGELS · RAG & Agentic RAG Midterm Hackathon`
**Live**: `🟢 batchmate.ilyankhan.tech`

**Team Members** (list all 6):
> Shahzaib Ali · Ali Hussain · Aqsa Sarfaraz · Arfa Rehman · Zainab Faiz · Warda Nadeem

---
**🎤 Script (Urdu/English mix — choose one)**:

**English:**
> *"Assalam o Alaikum judges. We are Team CampusLore. Our members are Shahzaib, Ali, Aqsa, Arfa, Zainab, and Warda. Today we present CampusLore — a production-grade Agentic RAG system built for university students. It is live right now on batchmate.ilyankhan.tech."*

**Urdu:**
> *"Assalam o Alaikum judges. Hamari team ka naam Team CampusLore hai. Hamare members hain Shahzaib, Ali, Aqsa, Arfa, Zainab, aur Warda. Aaj hum present kar rahe hain CampusLore — ek Agentic RAG system jo engineering students ke liye banaya gaya hai. Ye abhi live hai batchmate.ilyankhan.tech pe."*

---

### SLIDE 2 — Problem Statement (60 sec)

**📸 Screenshot**: ❌ No screenshot needed — use a clean visual with two contrast cards (text only)

**Title**: **The Problem**

**Left Card (❌ Generic AI — Red border)**:
- Hallucinates formulas, wrong syntax, incorrect algorithm traces
- Has no access to your university syllabus or professor's grading rubric
- No citations — students cannot verify any answer
- Basic RAG doesn't fix this — blind keyword retrieval ignores course context

**Right Card (😰 Student Reality — Amber border)**:
- 400+ pages of unstructured PDFs, WhatsApp drives, scattered handwriting
- 3 AM exam panic — 2 hours wasted finding one formula
- Senior notes disappear every year when students graduate
- No 24/7 academic help grounded in actual course material

---
**🎤 Script:**

**English:**
> *"Every semester, engineering students fail exams not because they don't study — but because the AI tools they use hallucinate. When you ask ChatGPT to solve a CIDR /26 subnetting problem according to your professor's rubric, it fabricates a generic answer with no citation. And basic RAG doesn't solve this either — it just does a dumb keyword search. Meanwhile, students are buried under 400 pages of PDFs and senior notes that disappear every graduation. This is the problem we solved."*

**Urdu:**
> *"Har semester engineering students imtihaan mein isliye fail nahi hote ke woh parhtay nahi — balkay isliye ke jo AI tools woh use karte hain woh galat jawab dete hain. ChatGPT se CIDR subnetting pocho toh woh apni taraf se jawab bana deta hai, koi source nahi. Aur basic RAG bhi yeh problem solve nahi karta. Saath hi, senior notes har graduation ke baad khatam ho jaate hain. Yahi woh masla hai jise humne solve kiya."*

---

### SLIDE 3 — Solution + Technology Stack (70 sec)

**📸 Screenshot**: `02_desktop_grounded_answer.png` — small thumbnail showing real KaTeX answer with routing tag. Just a preview — demo video shows it in action.

**Title**: **CampusLore — Agentic RAG Solution**

**3 Solution Pillars**:
1. 🧭 **Agentic Query Router** — Automatically identifies subject (OS, Networks, DSA, DBMS, Digital Logic, Math) and curriculum week, then plans retrieval strategy — not just a keyword match
2. 🛡️ **Confidence Gate** — If similarity score < 0.65, the system explicitly flags "General AI Mode" instead of hallucinating a grounded answer
3. 📐 **AST-Aware Chunking** — Preserves code function boundaries and LaTeX equation blocks so derivations are never split mid-step

**Technology Stack**:

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| AI / LLM | Groq Llama 3.3 70B (SSE streaming) |
| Embeddings | FastEmbed ONNX (384-dim vectors) |
| Vector DB | PostgreSQL + pgvector |
| Backend | FastAPI (Python) |
| Chunking | AST-aware + semantic boundary detection |
| Hosting | Render (backend) + Vercel (frontend) |
| Math Rendering | KaTeX LaTeX |

---
**🎤 Script:**

**English:**
> *"CampusLore uses Agentic RAG — not basic RAG. The difference is our Agentic Query Router. When a student asks a question, it doesn't just do a vector similarity search. It identifies the subject and the curriculum week, picks a retrieval strategy, and if it doesn't find enough evidence — it explicitly says so instead of hallucinating. Our chunker is AST-aware meaning it never cuts a code function or math equation in half. The tech stack is Groq Llama 3.3 with FastEmbed vectors in PostgreSQL pgvector, served through a FastAPI backend with React frontend."*

**Urdu:**
> *"CampusLore Agentic RAG use karta hai — basic RAG nahi. Faraq yeh hai ke hamare paas ek Agentic Query Router hai. Jab student koi sawaal poochay, yeh seedha vector search nahi karta — pehle subject identify karta hai, curriculum week nikalta hai, phir retrieval strategy decide karta hai. Agar evidence nahi milta toh explicitly bolta hai ke 'mujhe nahi pata' — hallucination nahi karta. Tech stack mein Groq Llama 3.3, FastEmbed vectors, PostgreSQL pgvector, FastAPI aur React shaamil hain."*

---

### SLIDE 4 — High-Level Architecture Diagram (60 sec)

**📸 Screenshot**: ❌ No screenshot — use a clean architecture diagram (draw it in PowerPoint/Canva with boxes and arrows)

**Title**: **System Architecture — How Components Communicate**

**Diagram to draw** (left to right flow):

```
┌─────────────┐     HTTPS/REST      ┌──────────────────────┐
│   React     │ ─────────────────► │    FastAPI Backend    │
│  Frontend   │ ◄──── SSE Stream ── │    (Python)          │
│  (Vercel)   │                     └──────────┬───────────┘
└─────────────┘                                │
                                     ┌─────────▼───────────┐
                                     │  Agentic RAG Engine  │
                                     │  ┌───────────────┐   │
                                     │  │ Query Router  │   │
                                     │  │ + Week Planner│   │
                                     │  └──────┬────────┘   │
                                     │         │             │
                                     │  ┌──────▼────────┐   │
                                     │  │ AST Chunker + │   │
                                     │  │ FastEmbed ONNX│   │
                                     │  └──────┬────────┘   │
                                     │         │             │
                                     │  ┌──────▼────────┐   │
                                     │  │  pgvector     │   │
                                     │  │  Hybrid Search│   │
                                     │  └──────┬────────┘   │
                                     │         │             │
                                     │  ┌──────▼────────┐   │
                                     │  │ Confidence    │   │
                                     │  │ Gate (≥0.65)  │   │
                                     │  └──────┬────────┘   │
                                     └─────────┼────────────┘
                                               │
                                  ┌────────────▼────────────┐
                                  │   Groq Llama 3.3 70B    │
                                  │   (SSE Token Stream)     │
                                  └─────────────────────────┘
```

**Key Communication Points to highlight verbally**:
- Frontend ↔ Backend: HTTPS REST + Server-Sent Events (SSE) for real-time streaming
- Backend ↔ pgvector: Local PostgreSQL queries (sub-20ms)
- Backend ↔ Groq API: External LLM call with streamed response
- Backend ↔ FastEmbed: Local ONNX runtime (no GPU, no external API)

---
**🎤 Script:**

**English:**
> *"Here is how our system communicates. The React frontend sends the student's question to our FastAPI backend over HTTPS. The backend passes it to our Agentic RAG Engine — first the Query Router decides the subject and week, then FastEmbed generates a 384-dimensional vector locally using ONNX so no external API is needed. This vector searches our pgvector database in under 20 milliseconds. The confidence gate checks the score — if it passes, the retrieved context goes to Groq's Llama 3.3 70B model. The answer streams back token by token through Server-Sent Events to the frontend in under 500 milliseconds."*

**Urdu:**
> *"Yeh diagram dikhata hai ke hamare system ke components kaise communicate karte hain. React frontend student ka sawaal FastAPI backend ko bhejta hai. Backend Agentic RAG Engine mein jaata hai — pehle Query Router subject aur week decide karta hai, phir FastEmbed locally vector banata hai ONNX se — koi external API ki zaroorat nahi. Yeh vector pgvector database mein 20 milliseconds mein search karta hai. Confidence gate score check karta hai — agar pass ho gaya toh Groq Llama 3.3 ko context bhejte hain aur jawab 500 milliseconds mein SSE ke zariye stream hota hai."*

---

### SLIDE 5 — Closing + Demo Note (30 sec)

**📸 Screenshot**: ❌ No screenshot needed

**Title**: **CampusLore is Live**

**Content**:
- 🟢 **Production**: `batchmate.ilyankhan.tech`
- 💻 **Open Source**: `github.com/Ilyan321/campusvault`
- 📹 **Full Demo**: See the attached demo video
- 💬 *"We welcome your questions!"*

**Team** (show one more time):
> Shahzaib Ali · Ali Hussain · Aqsa Sarfaraz · Arfa Rehman · Zainab Faiz · Warda Nadeem

---
**🎤 Script:**

**English:**
> *"CampusLore is not a prototype. It is live on production right now at batchmate.ilyankhan.tech. The full live demo — including the Agentic RAG routing, KaTeX math rendering, and source inspector — is in our separate demo video. Thank you judges, we welcome your questions."*

**Urdu:**
> *"CampusLore sirf ek prototype nahi — yeh abhi live production pe hai batchmate.ilyankhan.tech pe. Poora live demo — Agentic RAG routing, KaTeX math, aur source inspector — hamare alag demo video mein hai. Shukriya judges, hum aapke sawaalon ka intezaar kar rahe hain."*

---

## 📸 Screenshot Usage Summary

| Screenshot | Used? | Where |
|-----------|-------|-------|
| `01_desktop_launchpad.png` | ✅ YES | Slide 1 — small thumbnail/background |
| `02_desktop_grounded_answer.png` | ✅ YES | Slide 3 — small preview next to tech stack |
| `03_desktop_source_inspector.png` | ❌ Save for demo video | — |
| `04_desktop_upload_modal.png` | ❌ Save for demo video | — |
| `05_mobile_workstation.png` | ❌ Save for demo video | — |
| `06_mobile_curriculum_drawer.png` | ❌ Save for demo video | — |

> **Why only 2?** The judge explicitly said live demo is a separate video. Using all 6 screenshots wastes your 4-5 minute window. Let the demo video do the visual work — your presentation video should be clean, fast, and architecture-focused.

---

## 🏆 Judge Q&A Prep

| Question | Answer |
|---------|--------|
| **"Agentic RAG aur basic RAG mein kya farq hai?"** | *"Basic RAG sirf ek vector search karta hai aur result paste kar deta hai. Agentic RAG mein Query Router hai jo plan karta hai — subject identify karta hai, week decide karta hai, confidence check karta hai. Agar evidence nahi milta toh system explicitly kehta hai 'I don't know' — hallucination nahi karta."* |
| **"Why pgvector and not ChromaDB or Pinecone?"** | *"pgvector existing PostgreSQL mein integrate hota hai — no separate vector DB service needed. IVFFlat indexing ke saath sub-20ms retrieval milti hai 100k+ chunks pe bhi."* |
| **"How do you prevent hallucinations?"** | *"Confidence gate — 0.65 threshold. Below that, system explicitly flags 'General AI Mode'. Temperature 0.1 for LLM. Strict prompt grounding: LLM cannot answer without retrieved context."* |
| **"FastEmbed kyun, OpenAI embeddings kyun nahi?"** | *"FastEmbed ONNX runtime pe locally run karta hai — no external API call, no cost per embedding, much faster, no data privacy concern."* |
