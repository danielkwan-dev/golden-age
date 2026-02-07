import os
import yaml
from dataclasses import dataclass, field
from typing import List


@dataclass
class ModelConfig:
    variant: str = "yolo11n"
    task: str = "detect"
    image_size: int = 640
    pretrained: bool = True


@dataclass
class TrainingConfig:
    epochs: int = 100
    batch_size: int = 16
    learning_rate: float = 0.01
    optimizer: str = "AdamW"
    patience: int = 20
    device: str = "0"
    workers: int = 8
    augment: bool = True
    val_split: float = 0.15
    seed: int = 42
    resume: bool = False


@dataclass
class AudioConfig:
    whisper_model: str = "base"
    sample_rate: int = 16000
    chunk_duration_sec: int = 5


@dataclass
class InferenceConfig:
    confidence_threshold: float = 0.4
    iou_threshold: float = 0.45
    max_detections: int = 10
    frame_sample_interval: int = 5
    device: str = "0"
    show_labels: bool = True
    show_confidence: bool = True
    overlay_alpha: float = 0.4


@dataclass
class DataConfig:
    dataset_root: str = "data"
    images_dir: str = "images"
    labels_dir: str = "labels"
    audio_dir: str = "audio_clips"
    checkpoint_dir: str = "runs"
    dataset_yaml: str = "dataset.yaml"


@dataclass
class MidasConfig:
    model: ModelConfig = field(default_factory=ModelConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    inference: InferenceConfig = field(default_factory=InferenceConfig)
    data: DataConfig = field(default_factory=DataConfig)
    device_types: List[str] = field(default_factory=lambda: [
        "smartphone", "tablet", "laptop", "circuit_board", "desktop_component"
    ])
    fault_classes: List[str] = field(default_factory=list)


def load_config(config_path: str = None) -> MidasConfig:
    """Load config from YAML, falling back to defaults."""
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "default.yaml")

    cfg = MidasConfig()

    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            raw = yaml.safe_load(f)

        section_map = {
            "model": cfg.model,
            "training": cfg.training,
            "audio": cfg.audio,
            "inference": cfg.inference,
            "data": cfg.data,
        }
        for section_name, section_obj in section_map.items():
            if section_name in raw:
                for k, v in raw[section_name].items():
                    if hasattr(section_obj, k):
                        setattr(section_obj, k, v)

        if "device_types" in raw:
            cfg.device_types = raw["device_types"]
        if "fault_classes" in raw:
            cfg.fault_classes = raw["fault_classes"]

    return cfg
