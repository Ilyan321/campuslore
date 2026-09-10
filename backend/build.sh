#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- 📦 Step 1: Upgrading pip & Installing Application Dependencies ---"
pip install --upgrade pip
pip install -r requirements.txt

echo "--- 🧠 Step 2: Pre-caching FastEmbed ONNX Embedding Model during Build Phase ---"
export HF_HOME="${HF_HOME:-/opt/render/project/.cache/huggingface}"
mkdir -p "$HF_HOME"
python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

echo "--- ✅ Build Completed Successfully! ---"

