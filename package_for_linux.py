"""
Package the ALIVE Engine project into a clean .tar.gz archive for Linux workstation transfer.
Run from the project root: .venv\\Scripts\\python package_for_linux.py
"""
import json
import os
import shutil
import tarfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
STAGING_DIR = PROJECT_ROOT / "_staging_alive_engine"
ARCHIVE_NAME = "alive-engine.tar.gz"
ARCHIVE_PATH = PROJECT_ROOT / ARCHIVE_NAME

# The kostka test video
TEST_VIDEO_SRC = PROJECT_ROOT / "kostka edsawalk_192.168.0.12_KOSTKA @XAVIER_20251006090000_20251006122304_240184.mp4"
TEST_VIDEO_DST_NAME = "test_video.mp4"

# Directories/files to EXCLUDE from the copy
EXCLUDE_NAMES = {
    ".venv",
    ".next",
    "node_modules",
    "__pycache__",
    ".git",
    "tmp",
    "checkpoints",
    "get-pip.py",
    "tsconfig.tsbuildinfo",
    "Many People.mp4",
    "download_samples.py",
    "_staging_alive_engine",
    ARCHIVE_NAME,
    "package_for_linux.py",
    # The kostka video with its long name — we copy it separately as test_video.mp4
    TEST_VIDEO_SRC.name,
}

# Files inside storage that should be cleaned (keep only .gitkeep)
STORAGE_CLEAN_DIRS = [
    "backend/storage/videos/raw",
    "backend/storage/videos/processed",
    "backend/storage/exports",
]


def should_exclude(path: Path, root: Path) -> bool:
    """Check if a path should be excluded."""
    rel = path.relative_to(root)
    # Check each part of the relative path
    for part in rel.parts:
        if part in EXCLUDE_NAMES:
            return True
    return False


def copy_tree_filtered(src: Path, dst: Path):
    """Copy directory tree, excluding unwanted files/dirs."""
    dst.mkdir(parents=True, exist_ok=True)
    for item in sorted(src.iterdir()):
        if should_exclude(item, PROJECT_ROOT):
            continue
        target = dst / item.name
        if item.is_dir():
            copy_tree_filtered(item, target)
        else:
            shutil.copy2(item, target)


def clean_storage_dirs(staging: Path):
    """Remove runtime data from storage dirs, keeping only .gitkeep."""
    for rel_dir in STORAGE_CLEAN_DIRS:
        d = staging / rel_dir
        if not d.exists():
            continue
        for child in list(d.iterdir()):
            if child.name == ".gitkeep":
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()


def clean_models_dir(staging: Path):
    """Keep only hybrid_2500_fold1.pt in models dir."""
    models_dir = staging / "backend" / "storage" / "models"
    if not models_dir.exists():
        return
    for child in list(models_dir.iterdir()):
        if child.name in (".gitkeep", "hybrid_2500_fold1.pt"):
            continue
        child.unlink()
        print(f"  Removed extra model: {child.name}")


def reset_dev_data(staging: Path):
    """Reset dev_data.json to clean seed state with correct model."""
    data_file = staging / "backend" / "storage" / "dev_data.json"
    seed = {
        "model": {"currentModel": "hybrid_2500_fold1.pt", "uploadedAt": None},
        "locations": [
            {"id": "edsa-sec-walk", "name": "EDSA Sec Walk", "latitude": 14.6397, "longitude": 121.0775, "description": "Approximate Xavier Hall camera anchor along the EDSA security walkway.", "address": "Ateneo de Manila University \u00b7 Xavier Hall"},
            {"id": "kostka-walk", "name": "Kostka Walk", "latitude": 14.6390, "longitude": 121.0781, "description": "Approximate Kostka Hall pedestrian corridor camera anchor.", "address": "Ateneo de Manila University \u00b7 Kostka Hall"},
            {"id": "gate-1-walkway", "name": "Gate 1 Walkway", "latitude": 14.6418, "longitude": 121.0758, "description": "Approximate Gate 1 walkway camera anchor.", "address": "Ateneo de Manila University \u00b7 Gate 1"},
            {"id": "gate-3-walkway", "name": "Gate 3 Walkway", "latitude": 14.6376, "longitude": 121.0742, "description": "Approximate Gate 3 walkway camera anchor.", "address": "Ateneo de Manila University \u00b7 Gate 3"},
        ],
        "videos": [],
        "events": [],
        "pedestrianTracks": [],
    }
    data_file.write_text(json.dumps(seed, indent=2), encoding="utf-8")
    print("  dev_data.json reset to clean state (model: hybrid_2500_fold1.pt)")


def remove_pycache(staging: Path):
    """Remove any __pycache__ that slipped through."""
    for cache_dir in staging.rglob("__pycache__"):
        shutil.rmtree(cache_dir)


def copy_test_video(staging: Path):
    """Copy the kostka test video as test_video.mp4."""
    if TEST_VIDEO_SRC.exists():
        dst = staging / TEST_VIDEO_DST_NAME
        print(f"  Copying test video ({TEST_VIDEO_SRC.stat().st_size / 1024 / 1024:.0f} MB)...")
        shutil.copy2(TEST_VIDEO_SRC, dst)
        print(f"  Saved as: {TEST_VIDEO_DST_NAME}")
    else:
        print(f"  WARNING: Test video not found at: {TEST_VIDEO_SRC}")


def create_archive(staging: Path, archive_path: Path):
    """Create a .tar.gz archive from the staging directory."""
    print(f"\n  Creating {archive_path.name}...")
    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(staging, arcname="alive-engine")
    size_mb = archive_path.stat().st_size / 1024 / 1024
    print(f"  Archive created: {archive_path.name} ({size_mb:.0f} MB)")


def main():
    print("=" * 50)
    print("  ALIVE Engine — Linux Packaging Script")
    print("=" * 50)

    # Clean previous staging
    if STAGING_DIR.exists():
        print("\nCleaning previous staging directory...")
        shutil.rmtree(STAGING_DIR)

    if ARCHIVE_PATH.exists():
        ARCHIVE_PATH.unlink()

    # Step 1: Copy project files (filtered)
    print("\n[1/7] Copying project files (excluding .venv, node_modules, checkpoints, etc.)...")
    copy_tree_filtered(PROJECT_ROOT, STAGING_DIR)

    # Step 2: Clean storage directories
    print("\n[2/7] Cleaning storage runtime data...")
    clean_storage_dirs(STAGING_DIR)

    # Step 3: Clean models (keep only hybrid)
    print("\n[3/7] Cleaning models directory...")
    clean_models_dir(STAGING_DIR)

    # Step 4: Reset dev_data.json
    print("\n[4/7] Resetting dev_data.json...")
    reset_dev_data(STAGING_DIR)

    # Step 5: Remove any __pycache__
    print("\n[5/7] Removing __pycache__ directories...")
    remove_pycache(STAGING_DIR)

    # Step 6: Copy test video
    print("\n[6/7] Including test video...")
    copy_test_video(STAGING_DIR)

    # Step 7: Create archive
    print("\n[7/7] Creating archive...")
    create_archive(STAGING_DIR, ARCHIVE_PATH)

    # Cleanup staging
    print("\nCleaning up staging directory...")
    shutil.rmtree(STAGING_DIR)

    # Summary
    print("\n" + "=" * 50)
    print("  Packaging complete!")
    print("=" * 50)
    print(f"\n  Archive: {ARCHIVE_PATH}")
    print(f"  Size:    {ARCHIVE_PATH.stat().st_size / 1024 / 1024:.0f} MB")
    print("\n  Transfer this file to the Linux workstation, then:")
    print("    tar -xzf alive-engine.tar.gz")
    print("    cd alive-engine")
    print("    bash setup.sh")
    print("    bash run.sh")


if __name__ == "__main__":
    main()
