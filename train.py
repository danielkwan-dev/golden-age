import os
from ultralytics import YOLO

# --- THE FORGE OF MIDAS ---
# Fine-tuning the Oracle to perceive the suffering of machines.
# "Touch Broken Tech. Restore to Gold."

def train_midas_oracle():
    """
    Initiate the fine-tuning process for the MIDAS YOLO model.
    Ensure your datasets/ directory is prepared with images and labels.
    """
    
    # Load a base model - YOLOv11 small is a good balance for mobile-optimized results
    # You can change to 'yolo11n.pt' for even faster inference (Nano)
    print("✨ Summoning the base Oracle...")
    model = YOLO('yolo11s.pt') 

    # Begin the transformation
    # data: Path to your data.yaml
    # epochs: Number of passes over the dataset
    # imgsz: Image resolution (standard is 640)
    # device: '0' for GPU, 'cpu' for CPU
    print("🔥 Igniting the forge... This may take time.")
    results = model.train(
        data='data.yaml',
        epochs=100,
        imgsz=640,
        batch=16,
        device='cpu', # Change to 0 if you have a CUDA-enabled GPU
        name='midas_restoration_v1',
        project='models/runs'
    )

    print("✅ The training is complete. The Oracle has evolved.")
    
    # Save the refined weights to our model sanctuary
    best_weights = os.path.join('models', 'runs', 'midas_restoration_v1', 'weights', 'best.pt')
    target_path = os.path.join('models', 'midas_yolo.pt')
    
    if os.path.exists(best_weights):
        import shutil
        shutil.copy(best_weights, target_path)
        print(f"🌟 Best weights enshrined at: {target_path}")
    else:
        print("⚠️ Warning: Could not find trained weights. Check 'models/runs' directory.")

if __name__ == "__main__":
    train_midas_oracle()
