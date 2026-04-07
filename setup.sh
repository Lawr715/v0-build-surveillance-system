#!/bin/bash
set -e

echo "============================================"
echo "  ALIVE Engine — Automated Setup"
echo "============================================"

# --- Prerequisites check ---
echo ""
echo "[0/5] Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found. Install Python 3.10+ first."
    echo "  Ubuntu: sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

PYTHON_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "  Python: $PYTHON_VER"

if ! command -v node &> /dev/null; then
    echo "ERROR: node not found. Install Node.js 18+ first."
    echo "  Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

NODE_VER=$(node --version)
echo "  Node.js: $NODE_VER"

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found. It should come with Node.js."
    exit 1
fi

# --- Step 1: Detect CUDA version from nvidia-smi ---
echo ""
echo "[1/5] Detecting NVIDIA GPU and CUDA version..."

if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. Please install NVIDIA drivers first."
    echo "  Ubuntu: sudo apt install nvidia-driver-535  (or newer)"
    exit 1
fi

GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
echo "  GPU: $GPU_NAME"

CUDA_VERSION=$(nvidia-smi | grep -oP 'CUDA Version: \K[0-9]+\.[0-9]+')
echo "  CUDA Driver Version: $CUDA_VERSION"

# Map driver CUDA version to PyTorch index URL
CUDA_MAJOR=$(echo "$CUDA_VERSION" | cut -d. -f1)
CUDA_MINOR=$(echo "$CUDA_VERSION" | cut -d. -f2)

if [ "$CUDA_MAJOR" -ge 13 ] || ([ "$CUDA_MAJOR" -eq 12 ] && [ "$CUDA_MINOR" -ge 4 ]); then
    TORCH_CUDA="cu124"
elif [ "$CUDA_MAJOR" -eq 12 ] && [ "$CUDA_MINOR" -ge 1 ]; then
    TORCH_CUDA="cu121"
elif [ "$CUDA_MAJOR" -eq 11 ] && [ "$CUDA_MINOR" -ge 8 ]; then
    TORCH_CUDA="cu118"
else
    echo "WARNING: CUDA $CUDA_VERSION detected. Falling back to cu118 (oldest supported)."
    TORCH_CUDA="cu118"
fi
echo "  Selected PyTorch build: $TORCH_CUDA"

# --- Step 2: Create Python virtual environment ---
echo ""
echo "[2/5] Creating Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet

# --- Step 3: Install PyTorch with detected CUDA ---
echo ""
echo "[3/5] Installing PyTorch with CUDA ($TORCH_CUDA)... (this may take a few minutes)"
pip install torch torchvision torchaudio --index-url "https://download.pytorch.org/whl/$TORCH_CUDA"

# --- Step 4: Install other Python dependencies ---
echo ""
echo "[4/5] Installing Python dependencies..."
pip install -r requirements.txt

# --- Step 5: Install frontend dependencies ---
echo ""
echo "[5/5] Installing frontend (Node.js) dependencies..."
npm install

# --- Verify ---
echo ""
echo "============================================"
echo "  Setup Verification"
echo "============================================"
python3 -c "
import torch
print(f'  PyTorch Version : {torch.__version__}')
print(f'  CUDA Available  : {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'  GPU Name        : {torch.cuda.get_device_name(0)}')
    mem_gb = torch.cuda.get_device_properties(0).total_mem / (1024**3)
    print(f'  GPU Memory      : {mem_gb:.1f} GB')
    if mem_gb < 6.0:
        print(f'  FP16 Mode       : Enabled (GPU < 6GB)')
    else:
        print(f'  FP16 Mode       : Disabled (GPU >= 6GB)')
"

if [ -f backend/storage/models/hybrid_2500_fold1.pt ]; then
    echo "  Model File      : hybrid_2500_fold1.pt found"
else
    echo "  Model File      : MISSING — place hybrid_2500_fold1.pt in backend/storage/models/"
fi

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "To start the application:"
echo "  Option 1 (recommended): bash run.sh"
echo "  Option 2 (manual):"
echo "    Terminal 1: source .venv/bin/activate && uvicorn backend.app.main:app --reload --port 8000"
echo "    Terminal 2: npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser."
