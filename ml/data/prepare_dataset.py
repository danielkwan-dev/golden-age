"""
Dataset preparation utilities for MIDAS YOLOv11 training.

Expected raw data layout:
    data/
      images/
        train/
          img_001.jpg
          img_002.jpg
        val/
          img_050.jpg
      labels/
        train/
          img_001.txt      # YOLO format: class_id cx cy w h (normalized)
          img_002.txt
        val/
          img_050.txt

This script:
  1. Generates the dataset.yaml that ultralytics expects.
  2. Optionally splits a flat folder into train/val.
"""

import os
import random
import shutil
import yaml
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from configs.config import load_config


def generate_dataset_yaml(config_path: str = None, output_path: str = None):
    """Generate the dataset.yaml file required by ultralytics YOLO training."""
    cfg = load_config(config_path)
    ml_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_root = os.path.join(ml_root, cfg.data.dataset_root)

    class_names = {i: name for i, name in enumerate(cfg.fault_classes)}

    dataset_yaml = {
        "path": data_root,
        "train": os.path.join(cfg.data.images_dir, "train"),
        "val": os.path.join(cfg.data.images_dir, "val"),
        "names": class_names,
    }

    if output_path is None:
        output_path = os.path.join(ml_root, cfg.data.dataset_yaml)

    with open(output_path, "w") as f:
        yaml.dump(dataset_yaml, f, default_flow_style=False, sort_keys=False)

    print(f"Dataset YAML written to {output_path}")
    print(f"  Classes: {len(class_names)}")
    return output_path


def split_dataset(
    images_dir: str,
    labels_dir: str,
    val_ratio: float = 0.15,
    seed: int = 42,
):
    """
    Split a flat images/ and labels/ directory into train/val subfolders.

    Before:
        images/  (flat, all images)
        labels/  (flat, all label .txt files)

    After:
        images/train/  images/val/
        labels/train/  labels/val/
    """
    random.seed(seed)

    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    all_images = [
        f for f in os.listdir(images_dir)
        if os.path.splitext(f)[1].lower() in image_exts
    ]
    random.shuffle(all_images)

    val_count = max(1, int(len(all_images) * val_ratio))
    val_images = set(all_images[:val_count])
    train_images = set(all_images[val_count:])

    for split_name, split_files in [("train", train_images), ("val", val_images)]:
        img_split_dir = os.path.join(images_dir, split_name)
        lbl_split_dir = os.path.join(labels_dir, split_name)
        os.makedirs(img_split_dir, exist_ok=True)
        os.makedirs(lbl_split_dir, exist_ok=True)

        for img_file in split_files:
            # Move image
            src_img = os.path.join(images_dir, img_file)
            dst_img = os.path.join(img_split_dir, img_file)
            if os.path.exists(src_img):
                shutil.move(src_img, dst_img)

            # Move corresponding label
            label_file = os.path.splitext(img_file)[0] + ".txt"
            src_lbl = os.path.join(labels_dir, label_file)
            dst_lbl = os.path.join(lbl_split_dir, label_file)
            if os.path.exists(src_lbl):
                shutil.move(src_lbl, dst_lbl)

    print(f"Split complete: {len(train_images)} train, {len(val_images)} val")


def create_sample_structure(config_path: str = None):
    """Create empty directory structure so users know where to place data."""
    cfg = load_config(config_path)
    ml_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_root = os.path.join(ml_root, cfg.data.dataset_root)

    dirs = [
        os.path.join(data_root, cfg.data.images_dir, "train"),
        os.path.join(data_root, cfg.data.images_dir, "val"),
        os.path.join(data_root, cfg.data.labels_dir, "train"),
        os.path.join(data_root, cfg.data.labels_dir, "val"),
        os.path.join(data_root, cfg.data.audio_dir),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"  Created: {d}")

    print("\nPlace your images and YOLO-format label .txt files in the "
          "train/ and val/ folders, then run generate_dataset_yaml().")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MIDAS dataset preparation")
    parser.add_argument("--config", type=str, default=None, help="Path to config YAML")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("init", help="Create empty directory structure")
    sub.add_parser("yaml", help="Generate dataset.yaml for YOLO training")

    split_parser = sub.add_parser("split", help="Split flat data into train/val")
    split_parser.add_argument("--images", type=str, required=True)
    split_parser.add_argument("--labels", type=str, required=True)
    split_parser.add_argument("--val-ratio", type=float, default=0.15)

    args = parser.parse_args()

    if args.command == "init":
        create_sample_structure(args.config)
    elif args.command == "yaml":
        generate_dataset_yaml(args.config)
    elif args.command == "split":
        split_dataset(args.images, args.labels, args.val_ratio)
    else:
        parser.print_help()
