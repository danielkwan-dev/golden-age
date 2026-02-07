"""
Merge the Phone Damage and Screen Damage Roboflow datasets into a single
unified dataset with remapped class IDs for YOLOv11 training.

Source datasets:
  phone_damage/  -> classes: 0=phone, 1=phone_damage
  screen_damage/ -> classes: 0=body_lecet, 1=body_retak, 2=lcd_garis,
                             3=lcd_retak, 4=lcd_rusak, 5=smartphone

Merged class mapping (8 classes):
  0: phone
  1: phone_damage
  2: body_lecet    (body scratch)
  3: body_retak    (body crack)
  4: lcd_garis     (LCD line/streak)
  5: lcd_retak     (LCD crack)
  6: lcd_rusak     (LCD broken)
  7: smartphone

Usage:
    python merge_datasets.py
"""

import os
import shutil
import yaml


# Unified class mapping
MERGED_CLASSES = {
    0: "phone",
    1: "phone_damage",
    2: "body_lecet",
    3: "body_retak",
    4: "lcd_garis",
    5: "lcd_retak",
    6: "lcd_rusak",
    7: "smartphone",
}

# How each source dataset's class IDs map to the merged IDs
PHONE_DAMAGE_REMAP = {0: 0, 1: 1}
SCREEN_DAMAGE_REMAP = {0: 2, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7}

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
MERGED_DIR = os.path.join(DATA_DIR, "merged")


def remap_labels(src_label_path: str, dst_label_path: str, remap: dict):
    """Copy a YOLO label file, remapping class IDs."""
    with open(src_label_path, "r") as f:
        lines = f.readlines()

    remapped = []
    for line in lines:
        parts = line.strip().split()
        if len(parts) >= 5:
            old_cls = int(parts[0])
            new_cls = remap.get(old_cls)
            if new_cls is not None:
                parts[0] = str(new_cls)
                remapped.append(" ".join(parts))

    with open(dst_label_path, "w") as f:
        f.write("\n".join(remapped) + "\n" if remapped else "")


def copy_split(src_dataset_dir: str, split_name: str, remap: dict, prefix: str):
    """
    Copy images and remapped labels from one dataset split into the merged dir.
    Prefixes filenames to avoid collisions between datasets.
    """
    # Roboflow uses "valid" not "val"
    src_split = split_name if split_name != "val" else "valid"
    src_img_dir = os.path.join(src_dataset_dir, src_split, "images")
    src_lbl_dir = os.path.join(src_dataset_dir, src_split, "labels")

    # Merged output uses "val" for YOLO convention
    dst_img_dir = os.path.join(MERGED_DIR, "images", split_name)
    dst_lbl_dir = os.path.join(MERGED_DIR, "labels", split_name)
    os.makedirs(dst_img_dir, exist_ok=True)
    os.makedirs(dst_lbl_dir, exist_ok=True)

    if not os.path.exists(src_img_dir):
        print(f"  Skipping {src_dataset_dir}/{src_split} (not found)")
        return 0

    count = 0
    for img_file in os.listdir(src_img_dir):
        ext = os.path.splitext(img_file)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
            continue

        # Prefix filename to avoid collisions
        new_name = f"{prefix}_{img_file}"
        label_file = os.path.splitext(img_file)[0] + ".txt"
        new_label = f"{prefix}_{label_file}"

        # Copy image
        shutil.copy2(
            os.path.join(src_img_dir, img_file),
            os.path.join(dst_img_dir, new_name),
        )

        # Remap and copy label
        src_lbl = os.path.join(src_lbl_dir, label_file)
        if os.path.exists(src_lbl):
            remap_labels(src_lbl, os.path.join(dst_lbl_dir, new_label), remap)
        else:
            # Create empty label (background / negative sample)
            open(os.path.join(dst_lbl_dir, new_label), "w").close()

        count += 1

    return count


def merge():
    """Merge both datasets into ml/data/merged/."""
    print("Merging datasets into:", MERGED_DIR)

    # Clean previous merge
    if os.path.exists(MERGED_DIR):
        shutil.rmtree(MERGED_DIR)

    phone_dir = os.path.join(DATA_DIR, "phone_damage")
    screen_dir = os.path.join(DATA_DIR, "screen_damage")

    total = 0
    for split in ["train", "val", "test"]:
        n1 = copy_split(phone_dir, split, PHONE_DAMAGE_REMAP, "pd")
        n2 = copy_split(screen_dir, split, SCREEN_DAMAGE_REMAP, "sd")
        print(f"  {split}: {n1} phone_damage + {n2} screen_damage = {n1 + n2}")
        total += n1 + n2

    # Write merged data.yaml
    dataset_yaml = {
        "path": MERGED_DIR,
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": len(MERGED_CLASSES),
        "names": list(MERGED_CLASSES.values()),
    }

    yaml_path = os.path.join(MERGED_DIR, "data.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(dataset_yaml, f, default_flow_style=False, sort_keys=False)

    print(f"\nDone! {total} total images merged.")
    print(f"Dataset YAML: {yaml_path}")
    print(f"Classes ({len(MERGED_CLASSES)}):")
    for i, name in MERGED_CLASSES.items():
        print(f"  {i}: {name}")


if __name__ == "__main__":
    merge()
