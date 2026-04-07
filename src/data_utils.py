import os
import random
from pathlib import Path
import yaml
from sklearn.model_selection import KFold
import numpy as np

def get_project_root():
    """Returns the root directory of the project (Thesis_Portable_Pkg)."""
    return Path(__file__).resolve().parent.parent

def setup_dataset(dataset_type, size, fold=1):
    """
    Prepares the dataset configuration for training with K-Fold CV.
    
    Args:
        dataset_type (str): 'unaugmented' or 'augmented'
        size (int or str): Number of images (e.g., 500) or 'full'
        fold (int): Fold index (1-5)
        
    Returns:
        str: Absolute path to the modified data.yaml file
    """
    project_root = get_project_root()
    base_data_path = project_root / "data" / dataset_type
    config_path = project_root / "configs" / f"{dataset_type}.yaml"
    
    # 1. Read base config
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    # 2. Fix 'path' to be absolute for YOLO
    config['path'] = str(base_data_path.resolve())
    
    # 3. Handle K-Fold Splits
    # Ensure splits exist
    create_kfold_splits(base_data_path, n_splits=5)
    
    train_fold_file = base_data_path / f"splits_clean" / f"train_fold_{fold}.txt"
    val_fold_file = base_data_path / f"splits_clean" / f"val_fold_{fold}.txt"
    
    # 4. Handle Progressive Sizing (subsetting the TRAINING fold)
    if str(size).lower() != 'full':
        if dataset_type == 'augmented':
             # Mixed Training: 80% Unaugmented + 20% Augmented
             # We rely on 'data/unaugmented' for the bulk, and 'data/augmented' (filtered) for the rest.
             subset_file = create_mixed_subset(project_root, size, fold)
             config['train'] = str(subset_file)
        else:
             # Standard Unaugmented Subset
             subset_file = create_subset_from_fold(base_data_path, train_fold_file, int(size), fold)
             config['train'] = str(subset_file)
    else:
        # Full Unaugmented
        if dataset_type == 'augmented':
             # "Full" Augmented isn't really defined well if we are always mixing.
             # User said "max 2000". If they ask for "full", let's default to max mixed?
             # OR simple fallback: just use the raw augmented fold (which is naturally mixed).
             # But user wants strict control.
             # Let's assume 'full' means 'full available mixed'.
             # For now, let's keep it simple: if specific size -> mix. If full -> use raw file.
             config['train'] = str(train_fold_file)
        else:
             config['train'] = str(train_fold_file)
        
        
    # ALWAYS use the pure unaugmented validation set for fair comparison
    val_fold_file = project_root / "data" / "unaugmented" / "splits_clean" / f"val_fold_{fold}.txt"
    config['val'] = str(val_fold_file)
    
    # 5. Save a temporary run-specific config
    temp_config_path = base_data_path / f"data_fold{fold}_{size}.yaml"
    with open(temp_config_path, 'w') as f:
        yaml.dump(config, f)
        
    return str(temp_config_path)

def create_kfold_splits(data_path, n_splits=5):
    """
    Generates K-Fold splits if they don't exist.
    Saves them to data_path/splits/train_fold_X.txt and val_fold_X.txt
    """
    splits_dir = data_path / "splits_clean"
    splits_dir.mkdir(exist_ok=True)
    
    # Check if all exist
    all_exist = all((splits_dir / f"train_fold_{i+1}.txt").exists() and 
                    (splits_dir / f"val_fold_{i+1}.txt").exists() 
                    for i in range(n_splits))
    
    if all_exist:
        return

    print(f"Generating {n_splits}-Fold splits for {data_path.name}...")
    print(f"DEBUG: Regenerating splits because checks failed.")
    
    # Gather ALL images (train + val from original structure if needed, or just all images)
    # The user mentioned "train folds, data folds". 
    # Usually we combine everything and split, OR we split the 'train' folder.
    # Let's split the 'train' folder images to preserve the original test set if it exists.
    # BUT standard CV usually splits the *entire* available development set.
    # Given the folder structure implies 'images/train', we will split THAT.
    
    images_dir = data_path / "images" / "train"
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    all_images = []
    for ext in valid_extensions:
        all_images.extend(list(images_dir.rglob(f"*{ext}")))
        all_images.extend(list(images_dir.rglob(f"*{ext.upper()}")))
    
    all_images.sort() # Ensure deterministic order before shuffle
    all_images = np.array(all_images)
    
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    for fold, (train_idx, val_idx) in enumerate(kf.split(all_images)):
        fold_num = fold + 1
        train_files = all_images[train_idx]
        val_files = all_images[val_idx]
        
        # Write files
        _write_txt(splits_dir / f"train_fold_{fold_num}.txt", train_files, data_path)
        _write_txt(splits_dir / f"val_fold_{fold_num}.txt", val_files, data_path)
        
def create_subset_from_fold(data_path, fold_file, size, fold_num):
    """
    Creates a subset of size N from a specific fold file.
    """
    subset_filename = f"train_fold_{fold_num}_size_{size}.txt"
    subset_path = data_path / "splits_clean" / subset_filename
    
    if subset_path.exists():
        return subset_path.relative_to(data_path) # Return relative for YAML? No, yaml uses absolute now? 
        # Wait, earlier I set path to absolute. 
        # But YOLO txt files must be relative to 'path' OR absolute.
        # Let's return absolute path to be safe/consistent with setup_dataset logic
        return subset_path

    print(f"Creating subset {size} for Fold {fold_num}...")
    with open(fold_file, 'r') as f:
        lines = f.readlines()
        
    # Filter lines to get valid paths
    valid_lines = [line.strip() for line in lines if line.strip()]
    
    # Random sample (deterministic)
    random.seed(42 + fold_num) # Vary seed by fold slightly or keep constant? 
    # Constant is better for comparing sizes within a fold.
    random.seed(42)
    
    if size > len(valid_lines):
         print(f"Warning: Size {size} > fold size {len(valid_lines)}. Using full fold.")
         selected_lines = valid_lines
    else:
         selected_lines = random.sample(valid_lines, size)
         
    with open(subset_path, 'w') as f:
        f.writelines(f"{line}\n" for line in selected_lines)
        
    return subset_path

def _write_txt(path, file_list, root_path):
    with open(path, 'w') as f:
        for p in file_list:
            # Use ABSOLUTE paths to avoid confusion with where the txt file is located
            # vs where the 'path' in yaml is rooted.
            f.write(f"{Path(p).resolve().as_posix()}\n")

def create_mixed_subset(project_root, size, fold_num, ratio=0.2):
    """
    Creates a mixed subset: (1-ratio) from Unaugmented, (ratio) from Augmented-only images.
    Augmented images are identified by having "(Augmented)" in their path.
    """
    # Define paths
    unaug_base = project_root / "data" / "unaugmented"
    aug_base = project_root / "data" / "augmented"
    
    # Target file
    mixed_file = aug_base / "splits_clean" / f"train_fold_{fold_num}_mixed_size_{size}.txt"
    if mixed_file.exists():
        return mixed_file
        
    print(f"Creating MIXED subset {size} for Fold {fold_num} (Ratio {ratio})...")
    
    # Load Source Pools
    # 1. Unaugmented Pool (Use the Unaugmented dataset's split to be safe/consistent)
    # We must ensure unaugmented splits exist first
    unaug_split = unaug_base / "splits_clean" / f"train_fold_{fold_num}.txt"
    if not unaug_split.exists():
        create_kfold_splits(unaug_base, n_splits=5)
    
    # Read unaugmented paths
    with open(unaug_split, 'r') as f:
        unaug_pool = [line.strip() for line in f.readlines() if line.strip()]

    # 2. Augmented Pool (From the Augmented dataset's split, but FILTERED)
    aug_split = aug_base / "splits_clean" / f"train_fold_{fold_num}.txt"
    if not aug_split.exists():
         create_kfold_splits(aug_base, n_splits=5)
         
    # Read augmented paths and filter
    with open(aug_split, 'r') as f:
        full_aug_fold = [line.strip() for line in f.readlines() if line.strip()]
        
    # Filter for ONLY truly augmented images (look for "(Augmented)" string in path)
    aug_only_pool = [line for line in full_aug_fold if "(Augmented)" in line]
    
    if not aug_only_pool:
        print(f"WARNING: No images with '(Augmented)' found in {aug_split}. Using full augmented folder as fallback.")
        aug_only_pool = full_aug_fold
    
    # Calculate counts
    size = int(size)
    n_aug_target = int(size * ratio)
    n_orig_target = size - n_aug_target
    
    random.seed(42) # Consistent seed
    
    # Sample Original
    if n_orig_target > len(unaug_pool):
        print(f"Warning: Requested {n_orig_target} original images but only {len(unaug_pool)} available. Using all.")
        selected_orig = unaug_pool
    else:
        selected_orig = random.sample(unaug_pool, n_orig_target)
        
    # Sample Augmented
    if n_aug_target > len(aug_only_pool):
        print(f"Warning: Requested {n_aug_target} augmented images but only {len(aug_only_pool)} available. Using all.")
        selected_aug = aug_only_pool
    else:
        selected_aug = random.sample(aug_only_pool, n_aug_target)
        
    # Combine
    combined = selected_orig + selected_aug
    random.shuffle(combined) # Shuffle so they are mixed in the file
    
    # Write
    mixed_file.parent.mkdir(parents=True, exist_ok=True)
    with open(mixed_file, 'w') as f:
         f.write('\n'.join(combined))
         
    print(f"Created mixed subset: {len(selected_orig)} Unaugmented + {len(selected_aug)} Augmented -> {len(combined)} Total")
    return mixed_file
