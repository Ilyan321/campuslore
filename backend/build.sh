#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- 🚀 Step 1: Installing CPU-only PyTorch (Lightweight RAM Profile) ---"
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo "--- 📦 Step 2: Installing Application Dependencies ---"
pip install -r requirements.txt

echo "--- 🧠 Step 3: Pre-caching HuggingFace Embedding Model during Build Phase ---"
export HF_HOME="${HF_HOME:-/opt/render/project/.cache/huggingface}"
mkdir -p "$HF_HOME"
python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='BAAI/bge-small-en-v1.5', local_dir_use_symlinks=False)"

echo "--- ✅ Build Completed Successfully! ---"
