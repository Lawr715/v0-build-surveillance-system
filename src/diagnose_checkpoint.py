
#!/usr/bin/env python3
import torch
import sys
from pathlib import Path

def diagnose_checkpoint(ckpt_path):
    print(f"Diagnosing Checkpoint: {ckpt_path}")
    if not Path(ckpt_path).exists():
        print(f"Error: Checkpoint file not found.")
        return

    try:
        # Load with weights_only=False to allow Ultralytics classes
        ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
        
        # Basic Ultralytics Checkpoint Structure
        keys = list(ckpt.keys())
        print(f"Keys available: {keys}")
        
        if 'epoch' in ckpt:
            print(f"Epoch: {ckpt['epoch']}")
        
        if 'train_args' in ckpt:
            print("Training Arguments within Checkpoint:")
            args = ckpt['train_args']
            if isinstance(args, dict):
                for k, v in args.items():
                    print(f"  {k}: {v}")
            else:
                print(f"  {args}")

    except Exception as e:
        print(f"Error loading checkpoint: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python diagnose_checkpoint.py <path_to_last.pt>")
        sys.exit(1)
    
    ckpt_path = sys.argv[1]
    diagnose_checkpoint(ckpt_path)
