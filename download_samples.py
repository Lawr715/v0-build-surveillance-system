import urllib.request
import os

model_url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt"
video_url = "https://github.com/intel-iot-devkit/sample-videos/raw/master/person-bicycle-car-detection.mp4"

os.makedirs("backend/storage/models", exist_ok=True)
os.makedirs("backend/storage/videos/raw", exist_ok=True)
os.makedirs("backend/storage/videos/processed", exist_ok=True)
os.makedirs("backend/storage/exports", exist_ok=True)

print("Downloading model...")
try:
    urllib.request.urlretrieve(model_url, "backend/storage/models/yolov8n.pt")
    print("Model downloaded.")
except Exception as e:
    print(f"Failed to download model: {e}")

print("Downloading video...")
try:
    urllib.request.urlretrieve(video_url, "backend/storage/videos/raw/sample.mp4")
    print("Video downloaded.")
except Exception as e:
    print(f"Failed to download video: {e}")
