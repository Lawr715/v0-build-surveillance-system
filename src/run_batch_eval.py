import os
import subprocess
from pathlib import Path

# Paths
ROOT_DIR = Path(r"c:\Users\Lawrence Paul\Desktop\Updated Thesis")
PKG_DIR = ROOT_DIR / "Thesis_Portable_Pkg"
EVAL_SCRIPT = PKG_DIR / "src" / "evaluate_advanced.py"
OUTPUT_DIR = ROOT_DIR / "All_Swin_Advanced_Results"

# We only care about best.pt
target_pts = list(ROOT_DIR.rglob("best.pt"))

print(f"Found {len(target_pts)} weights to evaluate.")

# Run models matching this pattern:
# Swin_Data_Efficiency_Results\Swin_Subset_500\2025-01-21-swin-fold5\weights\best.pt

for pt_path in target_pts:
    path_str = str(pt_path)
    
    # Simple logic to filter and parse Swin checks
    if "Swin_Data_Efficiency_Results" in path_str and "Swin_Subset" in path_str:
        # Extract Size
        try:
            size_part = [p for p in pt_path.parts if "Swin_Subset_" in p][0]
            size = size_part.split("_")[-1]
            
            # Extract Fold
            fold_part = [p for p in pt_path.parts if "swin-fold" in p][0]
            fold = fold_part.split("swin-fold")[-1]
            
            print(f"[{size} images, Fold {fold}] Running Evaluation...")
            
            # Subprocess
            cmd = [
                "python", str(EVAL_SCRIPT),
                "--model", "swin",
                "--dataset", "unaugmented",
                "--size", size,
                "--fold", fold,
                "--project", str(OUTPUT_DIR),
                "--weights", str(pt_path)
            ]
            
            subprocess.run(cmd, check=False)
        except Exception as e:
            print(f"Error parsing or evaluating path {path_str}: {e}")

print("Batch processing complete.")
