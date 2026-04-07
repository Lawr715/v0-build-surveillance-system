import argparse
import sys
import traceback
from pathlib import Path
from ultralytics import YOLO
import timm
# --- Explicitly Register Backbones for Ultralytics ---
# --- Explicitly Register Custom Modules and Patch Ultralytics ---
import register_modules
# -----------------------------------------------------
# ------------------------------------------------------------------------------
# -----------------------------------------------------
from data_utils import setup_dataset, get_project_root
import datetime

def log_message(message):
    try:
        root = get_project_root()
        log_file = root / "experiment_log.txt"
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(log_file, "a", encoding='utf-8') as f:
            f.write(f"[{timestamp}] {message}\n")
        print(f"[LOG] {message}")
    except Exception as e:
        print(f"Logging failed: {e}")

def check_results_completion(run_dir, target_epochs):
    # Ultralytics saves 'results.csv' in the run directory.
    # If the number of data rows matches target_epochs, it's done.
    results_file = run_dir / "results.csv"
    if results_file.exists():
        try:
            with open(results_file, 'r') as f:
                lines = f.readlines()
            # Header is 1 line. Data rows are the rest.
            # Sometimes header is 1 line, sometimes it's complex. 
            # But usually 1 line header.
            # Empty file check
            if len(lines) < 2: return False
            
            data_rows = len(lines) - 1 # exclude header
            # Clean up empty lines at end just in case
            data_rows = len([l for l in lines[1:] if l.strip()])
            
            if data_rows >= target_epochs:
                log_message(f"Completion verified via results.csv: {data_rows}/{target_epochs} epochs.")
                return True
        except Exception as e:
            print(f"Warning: Could not read results.csv: {e}")
    return False

def parse_args():
    parser = argparse.ArgumentParser(description="Train Thesis Models")
    parser.add_argument('--model', type=str, required=True, choices=['convnext', 'swin', 'hybrid'], help="Model architecture")
    parser.add_argument('--dataset', type=str, required=True, choices=['unaugmented', 'augmented'], help="Dataset type")
    parser.add_argument('--size', type=str, required=True, help="Dataset size (e.g., 500, 1000, or 'full')")
    parser.add_argument('--fold', type=int, default=1, help="Fold index (1-5)")
    parser.add_argument('--epochs', type=int, default=100, help="Number of training epochs")
    parser.add_argument('--batch', type=int, default=8, help="Batch size")
    parser.add_argument('--device', type=str, default='0', help="Device (0, 0,1, cpu)")
    parser.add_argument('--project', type=str, default=None, help="Save results to this project dir")
    return parser.parse_args()

def main():
    run_name = "UNKNOWN_RUN" # Default for error logging before args
    args = None
    try:
        args = parse_args()
        
        project_root = get_project_root()
        if args.project is None:
            args.project = str(project_root / "results")
            
        print(f"--- Starting Training ---")
        print(f"Model: {args.model}")
        print(f"Dataset: {args.dataset}")
        print(f"Size: {args.size}")
        print(f"Fold: {args.fold}")
        print(f"Device: {args.device}")
        
        log_message(f"STARTING RUN: Model={args.model} | Dataset={args.dataset} | Size={args.size} | Fold={args.fold}")
        
        # 1. Setup Data
        # This generates the temp yaml and subset txt if needed
        try:
            data_yaml_path = setup_dataset(args.dataset, args.size, args.fold)
        except Exception as e:
            print(f"Error setting up dataset: {e}")
            sys.exit(1)
            
        print(f"Data Config: {data_yaml_path}")
        
        # 2. Setup Model
        # Load the custom yaml for the architecture
        model_config = project_root / "configs" / "models" / f"{args.model}.yaml"
        if not model_config.exists():
            print(f"Error: Model config not found at {model_config}")
            sys.exit(1)
        
        # Initialize YOLO model from scratch (using the YAML architecture)
        # Note: You might want to load pretrained weights (e.g., yolov8n.pt) to transfer learn
        # but based on your colab, you were loading from yaml. 
        # If you want to transfer learn, load a pt file then cfg=yaml.
        # Here we follow the standard: model = YOLO('model.yaml') -> trains from scratch/random init
        # OR model = YOLO('yolov8n.pt') -> trains from pretrained.
        # The 'colab' code used: model = YOLO(".../convnext.yaml") -> From scratch/config
        
        # To use pretrained weights AND custom architecture, strict transfer learning is complex.
        # Usually `model = YOLO("yolo11n.pt")` uses standard architecture.
        # `model = YOLO("convnext.yaml")` uses custom architecture (random weights).
        # If you have specific pretrained backbone weights, code adjustments are needed.
        # Assuming "From Scratch" or "From Pretrained Backbones handled by timm/ultralytics"
        
        # 3. Check for existing checkpoint (Auto-Resume)
        run_name = f"{args.model}_{args.dataset}_{args.size}_fold{args.fold}"
        
        # Standard Ultralytics structure: project/name/weights/last.pt
        last_ckpt = Path(args.project) / run_name / "weights" / "last.pt"
        resume_training = False
        
        current_epoch = 0 # Default if check fails
        
        if last_ckpt.exists():
            # NEW: Check results.csv FIRST for robustness against corrupt checkpoints
            run_dir = Path(args.project) / run_name
            if check_results_completion(run_dir, args.epochs):
                print(f"Training already completed (Verified by results.csv).")
                log_message(f"SKIPPED: Training already completed (results.csv has {args.epochs} rows).")
                sys.exit(0)

            log_message(f"Checkpoint found at {last_ckpt}. Attempting resume.")
            print(f"RESUMING from checkpoint: {last_ckpt}")
            resume_training = True
            
            # Check if training is already finished
            try:
                import torch
                ckpt = torch.load(str(last_ckpt), map_location='cpu', weights_only=False)
                if 'epoch' in ckpt:
                    current_epoch = ckpt['epoch']
                    if current_epoch >= args.epochs - 1:
                        msg = f"Training already completed (Epoch {current_epoch+1}/{args.epochs})."
                        print(msg)
                        log_message(f"SKIPPED: {msg}")
                        print("To restart, delete the results folder or use --force.")
                        sys.exit(0) # Standard behavior is to exit 0 if done.
                
                print(f"[DEBUG] Checkpoint detected at Epoch: {current_epoch}")
                        # Ultralytics will do this anyway, but printing it helps diagnosis.
            except Exception as e:
                print(f"Warning: Could not inspect checkpoint: {e}")
    
            try:
                model = YOLO(str(last_ckpt), task='detect')
            except Exception as e:
                 print(f"Error loading checkpoint: {e}")
                 sys.exit(1)
        else:
            # Initialize from config (Start Fresh)
            try:
                model = YOLO(str(model_config), task='detect')
            except Exception as e:
                print(f"Error initializing model: {e}")
                sys.exit(1)
    
        # 4. Train
        # If resuming, 'data' and 'epochs' are usually loaded from the .pt file,
        # but passing them again doesn't hurt and ensures consistency if config changed.
        # However, 'resume=True' is the critical flag.
        
        def on_train_epoch_end(trainer):
            if (project_root / "stop_training").exists():
                print(f"\n[INFO] 'stop_training' file detected. Stopping training gracefully after this epoch.")
                # FORCE EXIT with code 100 so shell script knows to stop everything
                sys.exit(100)
    
        model.add_callback("on_train_epoch_end", on_train_epoch_end)
    
        try:
            model.train(
                data=data_yaml_path,
                epochs=args.epochs,
                batch=args.batch,
                device=args.device,
                project=args.project,
                name=run_name,
                exist_ok=True, 
                save=True,
                plots=True,
                resume=resume_training,
                lr0=1e-5,    # VERY Low Learning Rate to prevent NaN
                lrf=1.0,     # Prevent LR from decaying to zero, keep it steady
                patience=0,  # DISABLE Early Stopping. Force 150 Epochs.
                amp=False,   # DISABLE Mixed Precision to prevent NaN losses
                optimizer='AdamW', 
                workers=0    # WORKERS=0 means NO multiprocessing (SAFE MODE)
            )
        except Exception as e:
            error_str = str(e)
            # Check if this is an Early Stopping finish
            if "training to" in error_str and "is finished" in error_str:
                 log_message(f"SKIPPED: YOLO reported training is already finished (likely Early Stopping). ({error_str})")
                 print("Early stopping confirmed. Skipping safely.")
                 sys.exit(0)
                 
            # Broaden to catch ANY error during resume, not just AssertionError
            log_message(f"Resume attempt failed with error: {error_str}")
            
            warn_msg = "Resume failed (likely finished or error). Switching to FRESH training."
            print(f"\n[WARNING] {warn_msg}")
            log_message(f"WARNING: {warn_msg}")
            print(f"Attempting to start FRESH training using weights from {last_ckpt}...")
            print(f"This will reset optimizer usage but keep learned weights.")
            
            # Re-initialize model from weights (Fresh Start)
            # Calculate remaining epochs
            remaining_epochs = args.epochs
            if current_epoch > 0:
                 remaining_epochs = args.epochs - (current_epoch + 1)
            
            if remaining_epochs <= 0:
                 print(f"Calculated remaining epochs {remaining_epochs} <= 0. Forcing 1 epoch to finalize.")
                 remaining_epochs = 1
                 
            print(f"Starting fresh training for REMAINING {remaining_epochs} epochs (Total target: {args.epochs}).")
    
            model = YOLO(str(last_ckpt), task='detect')
            model.train(
                data=data_yaml_path,
                epochs=remaining_epochs, # Use remaining count
                batch=args.batch,
                device=args.device,
                project=args.project,
                name=f"{run_name}_resume", # New name to avoid overwrite conflict
                exist_ok=True,
                save=True,
                plots=True,
                resume=False, # FORCE FALSE
                lr0=1e-5,
                lrf=1.0,
                patience=0,
                amp=False,
                optimizer='AdamW',
                workers=0    # WORKERS=0 means NO multiprocessing (SAFE MODE)
            )
        
        log_message(f"COMPLETED: {run_name}")
        print(f"Training finished. Results saved to {args.project}/{run_name}")
    
    except Exception as main_e:
        log_message(f"CRITICAL ERROR in {run_name}: {str(main_e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
