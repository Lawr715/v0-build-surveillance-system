
import argparse
import sys
import json
import numpy as np
import torch
import yaml
from pathlib import Path
from ultralytics import YOLO
import register_modules 
from data_utils import setup_dataset, get_project_root
from collections import defaultdict
from sklearn.metrics import roc_curve, auc
import matplotlib.pyplot as plt

# --- Metrics Calculation Utils ---

def compute_ap(recall, precision):
    """ Compute the average precision, given the recall and precision curves.
    Source: https://github.com/rbgirshick/py-faster-rcnn.
    # Arguments
        recall:    The recall curve (list).
        precision: The precision curve (list).
    # Returns
        The average precision as computed in py-faster-rcnn.
    """
    mrec = np.concatenate(([0.], recall, [1.]))
    mpre = np.concatenate(([0.], precision, [0.]))

    # Compute the precision envelope
    for i in range(mpre.size - 1, 0, -1):
        mpre[i - 1] = np.maximum(mpre[i - 1], mpre[i])
        
    # Integrate area under curve
    method = 'interp'  # methods: 'continuous', 'interp'
    i = np.where(mrec[1:] != mrec[:-1])[0]

    # and sum (\Delta recall) * prec
    ap = np.sum((mrec[i + 1] - mrec[i]) * mpre[i + 1])
    return ap

def compute_lamr(precisions, recalls, fppis=None):
    """
    Computes Log-Average Miss Rate (LAMR) and Miss Rate at specific FPPIs.
    Note: classic LAMR is MR averaged at 9 FPPI points in log-space [10^-2, 10^0].
    
    Args:
        precisions: list of precision values corresponding to recalls
        recalls: list of recall values
        fppis: list of FPPI values (optional, for MR@FPPI)
        
    Returns:
        lamr: float
        mr_at_fppi: dict {fppi_val: miss_rate}
    """
    # 1. Convert to Miss Rate (1 - Recall) vs FPPI
    # YOLO validation object gives us vectors, but usually P/R curves.
    # To get FPPI, we strictly need (FP count / Number_of_Images). 
    # YOLO's standard metrics object doesn't expose raw FP count per threshold in a simple way for FPPI.
    # We might need to estimate or use a simplified definition if we can't get raw detections.
    # HOWEVER, a common approximation is using the precision/recall points 
    # if we can assume a large number of negatives, but strict FPPI requires N_images.
    
    # Placeholder for accurate FPPI calculation which requires raw TP/FP per confidence.
    # For now, we will return placeholders or calculate standard AP-based metrics 
    # and mark LAMR as 'Requires Raw Detections' if we can't extract them simply.
    
    # Since we can't easily hook into the internal C++ like loop of YOLO to get the raw TP/FP list
    # without running prediction manually, we will implement manual prediction parsing below.
    return 0.0, {}

def calculate_mr_fppi(predictions, ground_truths, iou_thresh=0.5, num_images=1):
    """
    Calculates Miss Rate vs FPPI from raw predictions.
    
    Args:
        predictions: list of [image_id, class_id, confidence, x1, y1, x2, y2]
        ground_truths: dict {image_id: list of [class_id, x1, y1, x2, y2]}
        iou_thresh: IoU overlap threshold for TP
        num_images: Total number of images (for FPPI normalization)
    
    Returns:
        lamr: Log-Average Miss Rate
        mr_per_fppi: dict of Miss Rate at specific FPPIs [0.01, 0.1, 1.0]
    """
    # Sort predictions by confidence descending
    predictions.sort(key=lambda x: x[2], reverse=True)
    
    tp = np.zeros(len(predictions))
    fp = np.zeros(len(predictions))
    
    # Track which GTs have been detected
    gt_detected = {img_id: [False] * len(gts) for img_id, gts in ground_truths.items()}
    n_positives = sum(len(gts) for gts in ground_truths.values())
    
    if n_positives == 0:
        return float('nan'), {0.01: float('nan'), 0.1: float('nan'), 1.0: float('nan')}
        
    if len(predictions) == 0:
        return 1.0, {0.01: 1.0, 0.1: 1.0, 1.0: 1.0}

    for i, pred in enumerate(predictions):
        img_id = pred[0]
        cls_id = pred[1]
        bbox = pred[3:]
        
        best_iou = 0.0
        best_gt_idx = -1
        
        if img_id in ground_truths:
            for gt_idx, gt in enumerate(ground_truths[img_id]):
                if gt[0] != cls_id: continue # Must match class
                
                # Calulate IoU
                gt_bbox = gt[1:]
                ix1 = max(bbox[0], gt_bbox[0])
                iy1 = max(bbox[1], gt_bbox[1])
                ix2 = min(bbox[2], gt_bbox[2])
                iy2 = min(bbox[3], gt_bbox[3])
                
                iw = max(0, ix2 - ix1)
                ih = max(0, iy2 - iy1)
                
                intersection = iw * ih
                union = (bbox[2]-bbox[0])*(bbox[3]-bbox[1]) + (gt_bbox[2]-gt_bbox[0])*(gt_bbox[3]-gt_bbox[1]) - intersection
                
                iou = intersection / (union + 1e-6)
                
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = gt_idx
        
        if best_iou >= iou_thresh:
            if not gt_detected[img_id][best_gt_idx]:
                tp[i] = 1
                gt_detected[img_id][best_gt_idx] = True
            else:
                fp[i] = 1 # Duplicate detection
        else:
            fp[i] = 1 # Localization error or background
            
    # Accumulate
    acc_tp = np.cumsum(tp)
    acc_fp = np.cumsum(fp)
    
    # Recall = TP / N_pos
    recall = acc_tp / n_positives
    # Miss Rate = 1 - Recall
    miss_rate = 1.0 - recall
    
    # FPPI = FP / N_images
    fppi = acc_fp / num_images
    
    # --- LAMR Calculation ---
    # Log Average Miss Rate: average miss rate at 9 FPPI points even spaced in logspace between 10^-2 and 10^0
    refs = np.logspace(-2, 0, 9) # 0.01 to 1.0
    lamr_sum = 0.0
    
    # For interpolation
    for ref in refs:
        # Find closest FPPI
        # We need MR corresponding to this FPPI. Since FPPI is increasing, we can look up.
        # We want the smallest MR achievable at least at this FPPI (or interpolate).
        # Simple approach: find first index where fppi >= ref
        idx = np.searchsorted(fppi, ref)
        if idx < len(miss_rate):
            lamr_sum += miss_rate[idx]
        else:
            lamr_sum += miss_rate[-1] if len(miss_rate) > 0 else 1.0 # Saturation
            
    lamr = lamr_sum / 9.0
    
    # Specific FPPIs
    mr_at = {}
    for t in [0.01, 0.1, 1.0]:
        idx = np.searchsorted(fppi, t)
        if idx < len(miss_rate):
            mr_at[t] = miss_rate[idx]
        else:
            mr_at[t] = miss_rate[-1] if len(miss_rate) > 0 else 1.0
            
    return lamr, mr_at


def calculate_auc_roc(predictions, ground_truths, iou_thresh=0.5):
    """
    Calculates AUC-ROC for a class.
    
    Args:
        predictions: list of [image_id, class_id, confidence, x1, y1, x2, y2]
        ground_truths: dict {image_id: list of [class_id, x1, y1, x2, y2]}
        iou_thresh: IoU overlap threshold for TP
    
    Returns:
        auc: float
        fpr: array
        tpr: array
    """
    # Sort predictions by confidence descending
    predictions_sorted = sorted(predictions, key=lambda x: x[2], reverse=True)
    
    y_true = []
    y_scores = []
    
    gt_detected = {img_id: [False] * len(gts) for img_id, gts in ground_truths.items()}
    
    for pred in predictions_sorted:
        img_id = pred[0]
        cls_id = pred[1]
        conf = pred[2]
        bbox = pred[3:]
        
        y_scores.append(conf)
        
        best_iou = 0.0
        best_gt_idx = -1
        
        if img_id in ground_truths:
            for gt_idx, gt in enumerate(ground_truths[img_id]):
                if gt[0] != cls_id: continue
                
                # Calulate IoU
                gt_bbox = gt[1:]
                ix1 = max(bbox[0], gt_bbox[0])
                iy1 = max(bbox[1], gt_bbox[1])
                ix2 = min(bbox[2], gt_bbox[2])
                iy2 = min(bbox[3], gt_bbox[3])
                
                iw = max(0, ix2 - ix1)
                ih = max(0, iy2 - iy1)
                
                intersection = iw * ih
                union = (bbox[2]-bbox[0])*(bbox[3]-bbox[1]) + (gt_bbox[2]-gt_bbox[0])*(gt_bbox[3]-gt_bbox[1]) - intersection
                
                iou = intersection / (union + 1e-6)
                
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = gt_idx
        
        if best_iou >= iou_thresh:
            if not gt_detected[img_id][best_gt_idx]:
                y_true.append(1) # TP
                gt_detected[img_id][best_gt_idx] = True
            else:
                y_true.append(0) # FP (Duplicate)
        else:
            y_true.append(0) # FP
            
    if len(set(y_true)) < 2:
        return float('nan'), None, None
        
    fpr, tpr, _ = roc_curve(y_true, y_scores)
    roc_auc = auc(fpr, tpr)
    
    return roc_auc, fpr, tpr


# --- Main Script ---

def parse_args():
    parser = argparse.ArgumentParser(description="Advanced Analysis for Thesis Models")
    parser.add_argument('--model', type=str, required=True, choices=['convnext', 'swin', 'hybrid'], help="Model architecture")
    parser.add_argument('--dataset', type=str, required=True, choices=['unaugmented', 'augmented'], help="Dataset type")
    parser.add_argument('--size', type=str, required=True, help="Dataset size (e.g., 500, 1000, or 'full')")
    parser.add_argument('--fold', type=int, default=1, help="Fold index (1-5)")
    parser.add_argument('--device', type=str, default='0', help="Device (0, 0,1, cpu)")
    parser.add_argument('--project', type=str, default=None, help="Path to results directory")
    parser.add_argument('--weights', type=str, default=None, help="Specific weights file")
    parser.add_argument('--debug', action='store_true', help="Run in debug mode (fewer images)")
    return parser.parse_args()

def main():
    args = parse_args()
    project_root = get_project_root()
    
    # Setup data path (creates temp yaml)
    try:
        data_yaml_path = setup_dataset(args.dataset, args.size, args.fold)
    except Exception as e:
        print(f"Error setting up dataset: {e}")
        sys.exit(1)

    # --- Debug Mode Hack ---
    if args.debug:
        print("DEBUG MODE: Using small subset for verification.")
        # Create a debug yaml that points val to a small subset
        # reading original yaml
        with open(data_yaml_path, 'r') as f:
            config = yaml.safe_load(f)
            
        base_data_path = Path(config['path'])
        
        # We need to find some images to put in a debug list
        # We can reuse the train creation logic or just pick first 5 from val
        val_entry = config['val']
        val_path = base_data_path / val_entry
        # Fix path concat if config['val'] is absolute
        if Path(val_entry).is_absolute():
             val_path = Path(val_entry)

        debug_imgs = []
        if val_path.is_file() and val_path.suffix == '.txt':
             # Read from existing split file
             with open(val_path, 'r') as f:
                 lines = [line.strip() for line in f.readlines() if line.strip()]
                 # Resolve paths
                 for line in lines:
                      if Path(line).is_absolute():
                           p = Path(line)
                      else:
                           p = base_data_path / line
                      if p.exists():
                           debug_imgs.append(p)
                      if len(debug_imgs) >= 10: break
        elif val_path.is_dir():
            # Scan directory
            exts = ['.jpg', '.jpeg', '.png', '.bmp']
            for ext in exts:
                debug_imgs.extend(list(val_path.rglob(f"*{ext}")))
                if len(debug_imgs) >= 10: break
        
        debug_imgs = debug_imgs[:10]
        
        # Write debug txt
        debug_txt = base_data_path / "debug_val.txt"
        with open(debug_txt, 'w') as f:
            for img in debug_imgs:
                 try:
                    # Always write ABSOLUTE paths to avoid relative path confusion
                    # unless we are sure about the CWD or 'path' context.
                    # YOLO handles absolute paths fine in txt files.
                    f.write(f"{img.resolve().as_posix()}\n")
                 except:
                    pass
                    
        # Update config val
        config['val'] = "debug_val.txt"
        config['test'] = "debug_val.txt" # Force test to debug too
        
        # Save debug yaml
        debug_yaml_path = base_data_path / "data_debug.yaml"
        with open(debug_yaml_path, 'w') as f:
            yaml.dump(config, f)
            
        data_yaml_path = str(debug_yaml_path)
        print(f"Debug YAML created: {data_yaml_path}")

    # Resolve Weights
    run_name = f"{args.model}_{args.dataset}_{args.size}_fold{args.fold}"
    
    if args.project:
        results_dir = Path(args.project)
    else:
        results_dir = project_root / "results"
        
    if args.weights:
        weights_path = Path(args.weights)
        # If weights provided, we might want to append 'custom' to run_name or keep it generic
        # or derive from weights filename? 
        # For this script, run_name is just for saving results, so the standard naming is fine.
    else:
        weights_path = results_dir / run_name / "weights" / "best.pt"
    
    # Ensure results dir exists for saving our output
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # --- CHECK FOR COMPLETION ---
    # User requested skipping if evaluation is already done.
    # The script saves a JSON at the end. If it exists and is valid, we skip.
    res_file = results_dir / f"advanced_metrics_{run_name}.json"
    if res_file.exists():
        try:
             with open(res_file, 'r') as f:
                 data = json.load(f)
             # Basic validation: check if 'metrics' key exists
             if 'metrics' in data:
                 print(f"Evaluation already completed for {run_name}. (Found valid {res_file.name})")
                 print("SKIPPING evaluation.")
                 sys.exit(0)
        except Exception as e:
             print(f"Warning: Found existing results file {res_file}, but it seems corrupt or incomplete ({e}). Re-evaluating.")
    
    if not weights_path.exists():
        print(f"Weights not found: {weights_path}")
        sys.exit(1)
        
    print(f"Loading model: {weights_path}")
    try:
        model = YOLO(str(weights_path), task='detect')
    except Exception as e:
        print(f"Load failed: {e}")
        sys.exit(1)

    # 1. Run Standard Validation
    # We set save_json=True to help with advanced metric calculation if needed, 
    # but we can also iterate manually for MR/FPPI. 
    # Actually, iterate manually is better for full control over GT/Preds matching for LAMR.
    print("Running validation for Standard Metrics...")
    metrics = model.val(
        data=data_yaml_path,
        device=args.device,
        project=args.project or str(results_dir),
        name=f"eval_{run_name}",
        exist_ok=True,
        split='val',
        save_json=False,  # We will do manual inference for LAMR to ensure we have the raw data
        plots=True,
        batch=16,
        verbose=False 
    )
    
    # Dataset Clases
    # Assuming names: {0: 'light', 1: 'moderate', 2: 'heavy'}
    class_names = metrics.names
    
    # --- A) & B) Extraction ---
    # metrics.box.map    -> mAP50-95
    # metrics.box.map50  -> mAP50
    # metrics.box.map75  -> mAP75
    # metrics.box.maps   -> array of mAP50-95 per class 
    
    map50_overall = metrics.box.map50
    map75_overall = metrics.box.map75
    map5095_overall = metrics.box.map
    
    # Per-class mAP50-95
    ap5095_per_class = {}
    for i, name in class_names.items():
        try:
             # Try standard indexing or array extraction
             if hasattr(metrics.box, 'maps') and len(metrics.box.maps) > i:
                 ap5095_per_class[name] = metrics.box.maps[i]
             else:
                 ap5095_per_class[name] = 0.0
        except:
             ap5095_per_class[name] = 0.0
    
    # Per-class AP75 is tricky. metrics.box.all_ap might contain it.
    ap75_per_class = {}
    if hasattr(metrics.box, 'all_ap') and metrics.box.all_ap is not None and len(metrics.box.all_ap) > 0:
        for i, name in class_names.items():
            if i < metrics.box.all_ap.shape[0]:
                ap75_per_class[name] = metrics.box.all_ap[i, 5] 
            else:
                 ap75_per_class[name] = 0.0
    else:
        for i, name in class_names.items():
             ap75_per_class[name] = 0.0
        print("Warning: Could not extract specific AP75 per class from metrics object.")
    
    # --- C) Pedestrian Metrics (LAMR / MR@FPPI) ---
    print("Calculating Advanced Pedestrian Metrics (LAMR)...")
    
    # We need to run inference on the test set to get raw boxes for MR calculation
    # We'll load the validation set images
    # We read the data yaml to find the test/val path
    with open(data_yaml_path, 'r') as f:
        data_cfg = yaml.safe_load(f)
        
    test_path = data_cfg.get('test') or data_cfg.get('val') # Fallback to val if test not set
    # Note: data_utils.setup_dataset might have pointed 'train' to a subset txt, 
    # but 'val' typically points to a dir. 
    # We need to resolve the dataset path relative to config 'path'
    
    base_path = Path(data_cfg['path'])
    if Path(test_path).is_absolute():
        final_test_path = Path(test_path)
    else:
        final_test_path = base_path / test_path
        
    # Collect all images
    # Similar logic to data_utils
    exts = ['.jpg', '.jpeg', '.png', '.bmp']
    image_files = []
    if final_test_path.is_file() and final_test_path.suffix == '.txt':
        # List of files
        with open(final_test_path, 'r') as f:
            lines = f.readlines()
            # These might be relative to base_path or absolute. 
            # YOLO usually handles this, so we try to resolve.
            for line in lines:
                line = line.strip()
                if line.startswith('./'):
                    p = base_path / line
                else:
                    p = Path(line)
                if p.exists(): image_files.append(p)
    elif final_test_path.is_dir():
        for ext in exts:
            image_files.extend(final_test_path.rglob(f"*{ext}"))
    
    # Limit for safety/speed if needed, but for 'test' we do all
    # image_files = image_files[:100] 
    
    # Run Inference
    # Model predict returns a list of Results objects
    # We need to process image by image or batch
    
    all_preds_overall = [] # [img_id, cls, conf, x, y, x, y]
    all_gts_overall = defaultdict(list) # img_id -> [[cls, x, y, x, y]]
    
    # Per class buckets
    preds_by_class = defaultdict(list)
    gts_by_class = defaultdict(lambda: defaultdict(list))
    
    num_images = len(image_files)
    
    # To get GT, we need looking for corresponding labels
    # YOLO structure: images/val/name.jpg  ->  labels/val/name.txt
    
    print(f"Processing {num_images} images for custom metrics...")
    
    for i, img_path in enumerate(image_files):
        # 1. Inference
        results = model(img_path, verbose=False, iou=0.5, conf=0.001) # Low conf for high recall
        res = results[0]
        
        # 2. Get Preds
        # boxes.data format: (x1, y1, x2, y2, conf, cls)
        for box in res.boxes.data.cpu().numpy():
            x1, y1, x2, y2, conf, cls_id = box
            all_preds_overall.append([i, int(cls_id), conf, x1, y1, x2, y2])
            preds_by_class[int(cls_id)].append([i, int(cls_id), conf, x1, y1, x2, y2])
            
        # 3. Get GT
        # Assume standard YOLO layout
        # .../images/val/file.jpg -> .../labels/val/file.txt
        label_path = img_path.parent.parent.parent / "labels" / img_path.parent.name / (img_path.stem + ".txt")
        # If dataset structure is .../images/train/subset/, verify labels path
        # Fallback: replace 'images' with 'labels' in path
        if not label_path.exists():
             label_path = Path(str(img_path.parent).replace('images', 'labels')) / (img_path.stem + ".txt")
             
        if label_path.exists():
            h, w = res.orig_shape
            with open(label_path, 'r') as lf:
                for line in lf:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        c = int(parts[0])
                        cx, cy, bw, bh = map(float, parts[1:5])
                        
                        # Convert normalized xywh to pixel xyxy
                        x1 = (cx - bw/2) * w
                        y1 = (cy - bh/2) * h
                        x2 = (cx + bw/2) * w
                        y2 = (cy + bh/2) * h
                        
                        all_gts_overall[i].append([c, x1, y1, x2, y2])
                        gts_by_class[c][i].append([c, x1, y1, x2, y2])

    
    # Calculate LAMR / FPPI
    lamr_overall, mr_overall = calculate_mr_fppi(all_preds_overall, all_gts_overall, num_images=num_images)
    
    lamr_per_class = {}
    mr_per_class = {}
    
    for cls_id, name in class_names.items():
        if cls_id in gts_by_class or cls_id in preds_by_class:
            l, m = calculate_mr_fppi(preds_by_class[cls_id], gts_by_class[cls_id], num_images=num_images)
            lamr_per_class[name] = l
            mr_per_class[name] = m
        else:
            lamr_per_class[name] = 1.0 # Max miss rate
            mr_per_class[name] = {0.01: 1.0, 0.1: 1.0, 1.0: 1.0}

    # --- D) AUC-ROC ---
    print("Calculating AUC-ROC...")
    auc_per_class = {}
    roc_curves = {}
    
    for cls_id, name in class_names.items():
        if cls_id in preds_by_class:
            # Note: passing gts_by_class[cls_id] which only has GTs for that class
            auc_val, fpr, tpr = calculate_auc_roc(preds_by_class[cls_id], gts_by_class[cls_id])
            auc_per_class[name] = auc_val
            if fpr is not None:
                roc_curves[name] = (fpr, tpr)
        else:
            auc_per_class[name] = float('nan')

    # Plot AUC-ROC
    if roc_curves:
        plt.figure(figsize=(10, 8))
        for name, (fpr, tpr) in roc_curves.items():
            plt.plot(fpr, tpr, label=f'{name} (AUC = {auc_per_class[name]:.3f})')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {args.model} {args.dataset}')
        plt.legend(loc="lower right")
        plt.grid(True)
        
        roc_path = results_dir / f"roc_curve_{run_name}.png"
        plt.savefig(roc_path)
        plt.close()
        print(f"ROC Curve saved to {roc_path}")

    # --- E) Robustness Summary ---
    # AP50-95_heavy_minus_light
    # AP50-95_heavy_over_light
    try:
        h_l_diff = ap5095_per_class['heavy'] - ap5095_per_class['light']
        h_l_ratio = ap5095_per_class['heavy'] / (ap5095_per_class['light'] + 1e-6)
    except:
        h_l_diff = 0
        h_l_ratio = 0
        
    print("\n" + "="*50)
    print(f"ADVANCED EVALUATION REPORT: {args.model} | {args.dataset}")
    print("="*50)
    
    print("\n--- A) Stricter Detection Metrics (Overall) ---")
    print(f"mAP50 (Standard):    {map50_overall:.4f}")
    print(f"mAP75 (Stricter):    {map75_overall:.4f}")
    print(f"mAP50-95 (Combined): {map5095_overall:.4f}")
    
    print("\n--- B) Per-Occlusion Detection Metrics ---")
    print(f"{'Class':<10} | {'AP50-95':<10} | {'AP75':<10}")
    print("-" * 36)
    for name in class_names.values():
        val95 = ap5095_per_class.get(name, 0.0)
        val75 = ap75_per_class.get(name, 0.0)
        print(f"{name:<10} | {val95:.4f}     | {val75:.4f}")
        
    print("\n--- C) Pedestrian Metrics (Miss Rate / FPPI) ---")
    print(f"{'Metric':<20} | {'Overall':<10} | {'Light':<10} | {'Moderate':<10} | {'Heavy':<10}")
    print("-" * 75)
    
    # Rows: LAMR, MR@0.01, MR@0.1, MR@1.0
    def get_row(label, key_or_val_extractor):
        row = f"{label:<20} | "
        # Overall
        if callable(key_or_val_extractor):
            v = key_or_val_extractor(lamr_overall, mr_overall)
        else: 
            v = 0 # should not happen for simple keys
            
        row += f"{v:.4f}     | "
        
        for name in ['light', 'moderate', 'heavy']:
            if name in lamr_per_class:
                if callable(key_or_val_extractor):
                    v = key_or_val_extractor(lamr_per_class[name], mr_per_class[name])
                row += f"{v:.4f}     | "
            else:
                row += f"{'N/A':<10} | "
        print(row)
        
    get_row("LAMR (Log-Avg MR)", lambda l, m: l)
    get_row("MR @ FPPI=0.01", lambda l, m: m.get(0.01, 1.0))
    get_row("MR @ FPPI=0.10", lambda l, m: m.get(0.1, 1.0))
    get_row("MR @ FPPI=1.00", lambda l, m: m.get(1.0, 1.0))
    
    print("\n--- D) AUC-ROC ---")
    for name in class_names.values():
        val = auc_per_class.get(name, float('nan'))
        print(f"{name:<10} | AUC: {val:.4f}")

    print("\n--- E) Robustness Summary ---")
    print(f"AP50-95 (Heavy - Light): {h_l_diff:.4f}")
    print(f"AP50-95 (Heavy / Light): {h_l_ratio:.4f}")
    print("="*50)
    
    # Save Results
    res_file = results_dir / f"advanced_metrics_{run_name}.json"
    data = {
        "model": args.model,
        "dataset": args.dataset,
        "size": args.size,
        "metrics": {
            "mAP50": map50_overall,
            "mAP75": map75_overall,
            "mAP50-95": map5095_overall,
            "per_class": {
                name: {
                    "AP50-95": ap5095_per_class.get(name, 0),
                    "AP75": ap75_per_class.get(name, 0),
                    "LAMR": lamr_per_class.get(name, 1.0),
                    "MR_FPPI_0.1": mr_per_class.get(name, {}).get(0.1, 1.0),
                    "AUC_ROC": auc_per_class.get(name, 0)
                } for name in class_names.values()
            },
            "robustness": {
                "heavy_minus_light": h_l_diff,
                "heavy_over_light": h_l_ratio
            }
        }
    }
    
    with open(res_file, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"\nResults saved to {res_file}")

if __name__ == "__main__":
    main()
