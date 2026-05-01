from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import cv2
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تحميل النموذج مرة واحدة
model = YOLO("runs/detect/train/weights/best.pt")

@app.get("/")
def root():
    return {"status": "AI backend running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    start_time = time.time()

    image_bytes = await file.read()
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image"}

    # تقليل الدقة لزيادة السرعة
    img = cv2.resize(img, (640, 480))

    results = model(
        img,
        conf=0.5,      # ثقة أقل = استقرار أفضل
        iou=0.45,
        verbose=False
    )

    detections = []

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls = int(box.cls[0])
            label = model.names[cls]
            confidence = float(box.conf[0])

            detections.append({
                "label": label,
                "confidence": round(confidence, 2),
                "box": {
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                }
            })

    return {
        "count": len(detections),
        "detections": detections,
        "inference_ms": int((time.time() - start_time) * 1000)
    }
