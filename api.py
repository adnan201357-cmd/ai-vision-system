from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import os
from groq import Groq

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# ===============================
# Groq API (من Environment)
# ===============================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ===============================
# Load YOLO Model
# ===============================
model = YOLO("best.pt")

# ===============================
# Pages
# ===============================
@app.route("/")
def home():
    return render_template("login.html")

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/camera")
def camera():
    return render_template("camera.html")

@app.route("/detections")
def detections():
    return render_template("detections.html")

# ===============================
# Login (بدون قاعدة بيانات مؤقت)
# ===============================
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # login بسيط مؤقت
    if username == "admin" and password == "1234":
        return jsonify({
            "success": True,
            "username": username
        })

    return jsonify({
        "success": False,
        "message": "Invalid username or password"
    })

# ===============================
# Detect Frame
# ===============================
@app.route("/detect_frame", methods=["POST"])
def detect_frame():

    file = request.files["image"]
    img_bytes = file.read()

    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    results = model(frame)[0]

    detections = []

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        label = model.names[int(box.cls[0])]
        conf = float(box.conf[0])

        if conf > 0.5:
            detections.append({
                "label": label,
                "confidence": round(conf, 2),
                "box": [x1, y1, x2, y2]
            })

    return jsonify({"detections": detections})

# ===============================
# AI Chat (بدون DB)
# ===============================
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        object_name = data.get("object")
        question = data.get("question")

        prompt = f"""
You are an educational AI assistant.

Object: {object_name}
Question: {question}
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        answer = response.choices[0].message.content.strip()

        return jsonify({"answer": answer})

    except Exception as e:
        print(e)
        return jsonify({"answer": "AI service unavailable"})

# ===============================
# Run Server (مهم جدا لـ Render)
# ===============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Running on port {port}")
    app.run(host="0.0.0.0", port=port)
