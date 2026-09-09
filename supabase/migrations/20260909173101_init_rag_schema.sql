-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create main notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(384), -- 384 dimensions for BAAI/bge-small-en-v1.5
  file_url text,
  file_name text,
  week_number int NOT NULL,
  course_id text NOT NULL,
  topic text,
  chunk_index int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create HNSW index for lightning-fast cosine similarity search
CREATE INDEX IF NOT EXISTS notes_embedding_hnsw_idx 
ON notes USING hnsw (embedding vector_cosine_ops);

-- Composite index for fast course & week filtering
CREATE INDEX IF NOT EXISTS notes_course_week_idx 
ON notes (course_id, week_number);

-- Similarity Search RPC (Remote Procedure Call)
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5,
  filter_week int DEFAULT NULL,
  filter_course text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  file_url text,
  file_name text,
  week_number int,
  course_id text,
  topic text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    notes.id,
    notes.content,
    notes.file_url,
    notes.file_name,
    notes.week_number,
    notes.course_id,
    notes.topic,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE
    (filter_week IS NULL OR notes.week_number = filter_week)
    AND (filter_course IS NULL OR notes.course_id = filter_course)
    AND (1 - (notes.embedding <=> query_embedding)) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
$$;
